import { toEVMAddress, toBigNumber } from "@rarible/types"
import { awaitAll, deployTestErc721 } from "@rarible/ethereum-sdk-test-common"
import { toBn } from "@rarible/utils"

import { getEthereumConfig } from "../config"
import { getSendWithInjects, getSimpleSendWithInjects } from "../common/send-transaction"
import { delay } from "../common/retry"
import { getApis as getApisTemplate } from "../common/apis"
import { createErc721V3Collection } from "../common/mint"
import type { ERC721RequestV3, MintOffChainResponse } from "../nft/mint"
import { mint as mintTemplate } from "../nft/mint"
import { signNft } from "../nft/sign-nft"
import { DEV_PK_1, DEV_PK_2, getTestContract } from "../common/test/test-credentials"
import { MIN_PAYMENT_VALUE } from "../common/check-min-payment-value"
import {
  concatBuyerSellerProviders,
  createE2eTestProvider,
  createEthereumProviders,
} from "../common/test/create-test-providers"
import { sentTx } from "../common/test"
import { OrderBid } from "./bid"
import { signOrder as signOrderTemplate } from "./sign-order"
import { OrderFiller } from "./fill-order"
import { UpsertOrder } from "./upsert-order"
import { checkAssetType as checkAssetTypeTemplate } from "./check-asset-type"
import type { SimpleRaribleV2Order } from "./types"
import { approve as approveTemplate } from "./approve"
import { createErc20Contract } from "./contracts/erc20"

const pk1Provider = createE2eTestProvider(DEV_PK_1)
const pk2Provider = createE2eTestProvider(DEV_PK_2)

// const { providers, web3v4 } = createEthereumProviders(provider, wallet)
const pk1TestProviders = createEthereumProviders(pk1Provider.provider, pk1Provider.wallet)
const pk2TestProviders = createEthereumProviders(pk2Provider.provider, pk2Provider.wallet)

const providers = concatBuyerSellerProviders(pk1TestProviders.providers, pk2TestProviders.providers)

/**
 * @group provider/dev
 */
describe.each(providers)("bid", (ethereum1, ethereum2) => {
  const env = "dev-ethereum" as const
  const config = getEthereumConfig(env)
  const getConfig = async () => config
  const getApis1 = getApisTemplate.bind(null, ethereum1, env)
  const getApis2 = getApisTemplate.bind(null, ethereum2, env)

  const signOrder2 = signOrderTemplate.bind(null, ethereum2, getConfig)
  const checkAssetType = checkAssetTypeTemplate.bind(null, getApis2)
  const getBaseOrderFee = async () => 0
  const send2 = getSimpleSendWithInjects()
  const orderService = new OrderFiller(ethereum2, send2, getConfig, getApis2, getBaseOrderFee, env)
  const approve2 = approveTemplate.bind(null, ethereum2, send2, getConfig)

  const upserter = new UpsertOrder(
    orderService,
    send2,
    getConfig,
    x => Promise.resolve(x),
    approve2,
    signOrder2,
    getApis2,
    ethereum2,
  )
  const orderBid = new OrderBid(upserter, checkAssetType)

  const send1 = getSendWithInjects()
  const sign1 = signNft.bind(null, ethereum1, getConfig)
  const mint1 = mintTemplate.bind(null, ethereum1, send1, sign1, getApis1)
  const e2eErc721V3ContractAddress = getTestContract(env, "erc721V3")
  const erc20Contract = getTestContract(env, "erc20")

  const it = awaitAll({
    testErc721: deployTestErc721(pk1Provider.web3v4, "Test", "TST"),
  })

  beforeAll(async () => {
    const tx = await send2(
      createErc20Contract(ethereum2, erc20Contract).functionCall(
        "mint",
        await ethereum2.getFrom(),
        "1000000000000000000",
      ),
    )
    await tx.wait()
  })

  const filler1 = new OrderFiller(ethereum1, send1, getConfig, getApis1, getBaseOrderFee, env)

  test("create bid for collection", async () => {
    const ownerCollectionAddress = toEVMAddress(await ethereum1.getFrom())
    const bidderAddress = toEVMAddress(await ethereum2.getFrom())

    await sentTx(it.testErc721.methods.mint(ownerCollectionAddress, 0, "0x"), { from: ownerCollectionAddress })
    await sentTx(it.testErc721.methods.mint(ownerCollectionAddress, 1, "0x"), { from: ownerCollectionAddress })
    await delay(5000)

    const { order } = await orderBid.bid({
      type: "DATA_V2",
      maker: bidderAddress,
      end: generateExpirationTimestamp(),
      makeAssetType: {
        assetClass: "ERC20",
        contract: erc20Contract,
      },
      takeAssetType: {
        assetClass: "COLLECTION",
        contract: toEVMAddress(it.testErc721.options.address),
      },
      price: toBn("1000000000000000000"),
      amount: 1,
      payouts: [],
      originFees: [],
    })

    const acceptBidTx = await filler1.acceptBid({
      order: order as SimpleRaribleV2Order,
      amount: 1,
      originFees: [],
      assetType: {
        assetClass: "ERC721",
        contract: toEVMAddress(it.testErc721.options.address),
        tokenId: toBigNumber("1"),
      },
    })
    await acceptBidTx.wait()
  })

  test("create bid for erc-721 collection and accept bid with lazy-item", async () => {
    const ownerCollectionAddress = toEVMAddress(await ethereum1.getFrom())
    const bidderAddress = toEVMAddress(await ethereum2.getFrom())

    const mintedItem = (await mint1({
      collection: createErc721V3Collection(e2eErc721V3ContractAddress),
      uri: "ipfs://ipfs/QmfVqzkQcKR1vCNqcZkeVVy94684hyLki7QcVzd9rmjuG5",
      creators: [{ account: toEVMAddress(ownerCollectionAddress), value: 10000 }],
      royalties: [],
      lazy: true,
    } as ERC721RequestV3)) as MintOffChainResponse

    const { order } = await orderBid.bid({
      type: "DATA_V2",
      maker: bidderAddress,
      end: generateExpirationTimestamp(),
      makeAssetType: {
        assetClass: "ERC20",
        contract: erc20Contract,
      },
      takeAssetType: {
        assetClass: "COLLECTION",
        contract: e2eErc721V3ContractAddress,
      },
      price: toBn(MIN_PAYMENT_VALUE.toFixed()),
      amount: 1,
      payouts: [],
      originFees: [],
    })

    console.log("order", JSON.stringify(order, null, "  "))
    const acceptBidTx = await filler1.acceptBid({
      order: order as SimpleRaribleV2Order,
      amount: 1,
      originFees: [],
      assetType: {
        contract: e2eErc721V3ContractAddress,
        tokenId: mintedItem.item.tokenId,
      },
    })
    await acceptBidTx.wait()
  })
})

function generateExpirationTimestamp() {
  const expirationAt = new Date(Date.now() + 1000 * 60 * 60)
  return Math.floor(expirationAt.getTime() / 1000)
}
