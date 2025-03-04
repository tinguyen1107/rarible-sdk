import type { BigNumberValue } from "@rarible/utils"
import { EVM_ZERO_ADDRESS } from "@rarible/types"
import type { EVMAddress } from "@rarible/types"
import type { EthereumContract } from "@rarible/ethereum-provider"
import type { ConsiderationItem, InputCriteria, Order, OrderStruct } from "./types"
import type { BalancesAndApprovals } from "./balance-and-approval-check"
import type { TimeBasedItemParams } from "./item"
import { mapOrderAmountsFromFilledStatus, mapOrderAmountsFromUnitsToFill } from "./order"
import { getSummedTokenAndIdentifierAmounts, isCriteriaItem } from "./item"
import { validateStandardFulfillBalancesAndApprovals } from "./balance-and-approval-check"
import { getAdvancedOrderNumeratorDenominator } from "./fulfill"
import { generateCriteriaResolvers } from "./criteria"
import { mapTipAmountsFromUnitsToFill } from "./map-tips"

export async function getFulfillAdvancedOrderWrapperData({
  order,
  unitsToFill = 0,
  totalSize,
  totalFilled,
  offerCriteria,
  considerationCriteria,
  tips = [],
  extraData,
  offererBalancesAndApprovals,
  fulfillerBalancesAndApprovals,
  offererOperator,
  fulfillerOperator,
  timeBasedItemParams,
  conduitKey,
  recipientAddress,
  seaportContract,
  disableCheckingBalances,
}: {
  order: Order
  unitsToFill?: BigNumberValue
  totalFilled: BigNumberValue
  totalSize: BigNumberValue
  offerCriteria: InputCriteria[]
  considerationCriteria: InputCriteria[]
  tips?: ConsiderationItem[]
  extraData?: string
  seaportAddress: EVMAddress
  offererBalancesAndApprovals: BalancesAndApprovals
  fulfillerBalancesAndApprovals: BalancesAndApprovals
  offererOperator: string
  fulfillerOperator: string
  conduitKey: string
  recipientAddress: string
  timeBasedItemParams: TimeBasedItemParams
  seaportContract: EthereumContract
  disableCheckingBalances?: boolean
}) {
  // If we are supplying units to fill, we adjust the order by the minimum of the amount to fill and
  // the remaining order left to be fulfilled
  const orderWithAdjustedFills = unitsToFill
    ? mapOrderAmountsFromUnitsToFill(order, {
        unitsToFill,
        totalSize,
      })
    : // Else, we adjust the order by the remaining order left to be fulfilled
      mapOrderAmountsFromFilledStatus(order, {
        totalFilled,
        totalSize,
      })

  const {
    parameters: { offer, consideration },
  } = orderWithAdjustedFills

  let adjustedTips: ConsiderationItem[] = []

  if (tips.length > 0) {
    adjustedTips = mapTipAmountsFromUnitsToFill(tips, unitsToFill, totalSize)
  }

  const considerationIncludingTips = [...consideration, ...adjustedTips]

  const offerCriteriaItems = offer.filter(({ itemType }) => isCriteriaItem(itemType))

  const considerationCriteriaItems = considerationIncludingTips.filter(({ itemType }) => isCriteriaItem(itemType))

  const hasCriteriaItems = offerCriteriaItems.length > 0 || considerationCriteriaItems.length > 0

  if (
    offerCriteriaItems.length !== offerCriteria.length ||
    considerationCriteriaItems.length !== considerationCriteria.length
  ) {
    throw new Error("You must supply the appropriate criterias for criteria based items")
  }

  const totalNativeAmount = getSummedTokenAndIdentifierAmounts({
    items: considerationIncludingTips,
    criterias: considerationCriteria,
    timeBasedItemParams: {
      ...timeBasedItemParams,
      isConsiderationItem: true,
    },
  })[EVM_ZERO_ADDRESS]?.["0"]

  validateStandardFulfillBalancesAndApprovals({
    offer,
    consideration: considerationIncludingTips,
    offerCriteria,
    considerationCriteria,
    offererBalancesAndApprovals,
    fulfillerBalancesAndApprovals,
    timeBasedItemParams,
    offererOperator,
    fulfillerOperator,
    disableCheckingBalances,
  })

  const orderAccountingForTips: OrderStruct = {
    ...order,
    parameters: {
      ...order.parameters,
      consideration: [...order.parameters.consideration, ...tips],
      totalOriginalConsiderationItems: consideration.length,
    },
  }

  const { numerator, denominator } = getAdvancedOrderNumeratorDenominator(order, unitsToFill)

  const fulfillAdvancedOrderArgs = [
    {
      ...orderAccountingForTips,
      numerator,
      denominator,
      extraData: extraData ?? "0x",
    },
    hasCriteriaItems
      ? generateCriteriaResolvers({
          orders: [order],
          offerCriterias: [offerCriteria],
          considerationCriterias: [considerationCriteria],
        })
      : [],
    conduitKey,
    recipientAddress,
  ]

  return {
    data: await seaportContract.functionCall("fulfillAdvancedOrder", ...fulfillAdvancedOrderArgs).getData(),
    value: totalNativeAmount?.toFixed() || "0",
  }
}
