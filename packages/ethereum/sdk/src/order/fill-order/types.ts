import type { Address, BigNumber } from "@rarible/types"
import type { CryptoPunksAssetType, Erc1155AssetType, Erc721AssetType, Part } from "@rarible/ethereum-api-client"
import type { Action } from "@rarible/action"
import type { EthereumFunctionCall, EthereumSendOptions, EthereumTransaction } from "@rarible/ethereum-provider"
import type { Erc1155LazyAssetType, Erc721LazyAssetType } from "@rarible/ethereum-api-client/build/models/AssetType"
import type { EVMAddress } from "@rarible/types"
import type {
  SimpleCryptoPunkOrder,
  SimpleLegacyOrder,
  SimpleLooksrareOrder,
  SimpleOpenSeaV1Order,
  SimpleRaribleV2Order,
  SimpleSeaportV1Order,
  SimpleX2Y2Order,
  SimpleAmmOrder,
  SimpleLooksrareV2Order,
} from "../types"
import type { NftAssetType } from "../check-asset-type"

export type CommonFillRequestAssetType =
  | Erc721AssetType
  | Erc721LazyAssetType
  | Erc1155AssetType
  | Erc1155LazyAssetType
  | CryptoPunksAssetType
  | NftAssetType

export type CommonFillRequest<T> = {
  order: T
  amount: number
  infinite?: boolean
  assetType?: CommonFillRequestAssetType
}

export type LegacyOrderFillRequest = CommonFillRequest<SimpleLegacyOrder> & {
  payout?: Address | EVMAddress
  originFee: number
}

export type RaribleV2OrderFillRequest = RaribleV2OrderFillRequestV2 | RaribleV2OrderFillRequestV3

export type RaribleV2OrderFillRequestV2 = CommonFillRequest<SimpleRaribleV2Order> & OrderV2FillDataV2
export type RaribleV2OrderFillRequestV3 = CommonFillRequest<SimpleRaribleV2Order> & OrderV2FillDataV3

export type OrderV2FillDataV2 = { payouts?: Part[]; originFees?: Part[] }
export type OrderV2FillDataV3 = { payouts?: Part[]; originFees?: Part[] }

export type OpenSeaV1OrderFillRequest = Omit<CommonFillRequest<SimpleOpenSeaV1Order>, "amount"> & {
  payouts?: Part[]
  originFees?: Part[]
}

export type SeaportV1OrderFillRequest = CommonFillRequest<SimpleSeaportV1Order> & { originFees?: Part[] }
export type X2Y2OrderFillRequest = CommonFillRequest<SimpleX2Y2Order> & { originFees?: Part[] }

export type LooksrareOrderFillRequest = CommonFillRequest<SimpleLooksrareOrder> & {
  originFees?: Part[]
  addRoyalty?: boolean
}

export type LooksrareOrderV2FillRequest = CommonFillRequest<SimpleLooksrareV2Order> & {
  originFees?: Part[]
  addRoyalty?: boolean
}

export type AmmOrderFillRequest = CommonFillRequest<SimpleAmmOrder> & {
  originFees?: Part[]
  addRoyalty?: boolean
  assetType?: CommonFillRequestAssetType | CommonFillRequestAssetType[]
}

export type CryptoPunksOrderFillRequest = CommonFillRequest<SimpleCryptoPunkOrder>

export type SellOrderRequest =
  | LegacyOrderFillRequest
  | RaribleV2OrderFillRequestV2
  | RaribleV2OrderFillRequestV3
  | OpenSeaV1OrderFillRequest
  | SeaportV1OrderFillRequest
  | CryptoPunksOrderFillRequest
  | LooksrareOrderFillRequest
  | LooksrareOrderV2FillRequest
  | X2Y2OrderFillRequest
  | AmmOrderFillRequest

export type BuyOrderRequest =
  | LegacyOrderFillRequest
  | RaribleV2OrderFillRequestV2
  | RaribleV2OrderFillRequestV3
  | OpenSeaV1OrderFillRequest
  | SeaportV1OrderFillRequest
  | CryptoPunksOrderFillRequest
  | LooksrareOrderFillRequest
  | LooksrareOrderV2FillRequest
  | X2Y2OrderFillRequest
  | AmmOrderFillRequest

export type FillOrderRequest = SellOrderRequest | BuyOrderRequest

export type FillBatchSingleOrderRequest =
  | RaribleV2OrderFillRequestV2
  // RaribleV2OrderFillRequestV3Sell |
  // RaribleV2OrderFillRequestV3Buy |
  | OpenSeaV1OrderFillRequest
  | LooksrareOrderFillRequest
  | LooksrareOrderV2FillRequest
  | SeaportV1OrderFillRequest
  | X2Y2OrderFillRequest
  | AmmOrderFillRequest

export type FillBatchOrderRequest = FillBatchSingleOrderRequest[]

export enum ExchangeWrapperOrderType {
  RARIBLE_V2 = 0,
  OPENSEA_V1 = 1,
  SEAPORT_ADVANCED_ORDERS = 2,
  X2Y2 = 3,
  LOOKSRARE_ORDERS = 4,
  AAM = 5,
  SEAPORT_V14 = 6,
  LOOKSRARE_V2_ORDERS = 7,
  SEAPORT_V15 = 9,
  SEAPORT_V16 = 10,
}

export type PreparedOrderRequestDataForExchangeWrapper = {
  data: {
    marketId: ExchangeWrapperOrderType
    amount: string | number
    fees: BigNumber
    data: string
  }
  options: OrderFillSendData["options"]
}

export type FillOrderAction = Action<FillOrderStageId, FillOrderRequest, EthereumTransaction>
export type SellOrderAction = Action<FillOrderStageId, SellOrderRequest, EthereumTransaction>
export type AcceptBidOrderAction = Action<FillOrderStageId, SellOrderRequest, EthereumTransaction>
export type BuyOrderAction = Action<FillOrderStageId, BuyOrderRequest, EthereumTransaction>
export type FillOrderStageId = "approve" | "send-tx"

export type FillBatchOrderAction = Action<FillOrderStageId, FillBatchOrderRequest, EthereumTransaction>

export interface OrderHandler<T extends FillOrderRequest> {
  invert: (request: T, maker: EVMAddress) => T["order"] | Promise<T["order"]>
  approve: (order: T["order"], infinite: boolean) => Promise<void>
  getTransactionData: (order: T["order"], inverted: T["order"], request: T) => Promise<OrderFillSendData>

  /**
   * Calculates base fee for filling the order
   * @param order Order to fill
   * @param withOriginFees set to true if you plan to send origin fees with the order
   */
  getFillOrderBaseFee(order: T["order"], withOriginFees?: boolean): Promise<number> | number

  getOrderFee(order: T["order"]): Promise<number> | number
}

export type GetOrderFillTxData = (request: FillOrderRequest) => Promise<OrderFillTransactionData>
export type GetOrderBuyBatchTxData = (
  request: FillBatchSingleOrderRequest[],
  originFees: Part[] | undefined,
) => Promise<OrderFillTransactionData>

export type OrderFillTransactionData = {
  data: string
  contract: EVMAddress
  options: EthereumSendOptions
  from: EVMAddress
}

export type OrderFillSendData = {
  functionCall: EthereumFunctionCall
  options: EthereumSendOptions
}

export type GetOrderBuyTxData = (request: GetOrderBuyTxRequest) => Promise<TransactionData>

export type GetOrderBuyTxRequest = {
  request: FillOrderRequest
  from: Address | EVMAddress
}

export type TransactionData = {
  data: string
  value: string
  from: string
  to: string
}
