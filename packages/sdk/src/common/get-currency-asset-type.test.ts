import { toContractAddress, toCurrencyId, ZERO_ADDRESS } from "@rarible/types"
import type { EthErc20AssetType, EthEthereumAssetType, TezosFTAssetType, TezosXTZAssetType } from "@rarible/api-client"
import { Blockchain } from "@rarible/api-client"
import type { FlowAssetTypeFt, NativeCurrencyAssetType } from "@rarible/api-client/build/models/AssetType"
import type { TokenCurrencyAssetType } from "@rarible/api-client/build/models/AssetType"
import { convertCurrencyIdToAssetType, getCurrencyAssetType, getDataFromCurrencyId } from "./get-currency-asset-type"

describe("test getCurrencyAssetType", () => {
  test("get eth asset type from asset type", async () => {
    const assetType = getCurrencyAssetType({
      "@type": "ETH",
    })
    expect(assetType["@type"]).toEqual("ETH")
  })
  test("get erc-20 asset type from asset type", async () => {
    const assetType = getCurrencyAssetType({
      "@type": "ERC20",
      contract: toContractAddress("ETHEREUM:0x0000000000000000000000000000000000000001"),
    }) as EthErc20AssetType
    expect(assetType["@type"]).toEqual("ERC20")
    expect(assetType.contract).toEqual("ETHEREUM:0x0000000000000000000000000000000000000001")
  })
  test("get eth asset type from currency id", async () => {
    const assetType = getCurrencyAssetType(toCurrencyId(`ETHEREUM:${ZERO_ADDRESS}`)) as EthEthereumAssetType
    expect(assetType["@type"]).toEqual("ETH")
    expect(assetType.blockchain).toEqual(Blockchain.ETHEREUM)
  })
  test("get polygon eth asset type from currency id", async () => {
    const assetType = getCurrencyAssetType(toCurrencyId(`POLYGON:${ZERO_ADDRESS}`)) as EthEthereumAssetType
    expect(assetType["@type"]).toEqual("ETH")
    expect(assetType.blockchain).toEqual(Blockchain.POLYGON)
  })
  test("get erc-20 asset type from currency id", async () => {
    const assetType = getCurrencyAssetType(
      toCurrencyId("ETHEREUM:0x0000000000000000000000000000000000000001"),
    ) as EthErc20AssetType
    expect(assetType["@type"]).toEqual("ERC20")
    expect(assetType.contract).toEqual("ETHEREUM:0x0000000000000000000000000000000000000001")
  })
  test("get flow_ft asset type from currency id", async () => {
    const assetType = getCurrencyAssetType(toCurrencyId("FLOW:A.7e60df042a9c0868.FlowToken")) as FlowAssetTypeFt
    expect(assetType["@type"]).toEqual("FLOW_FT")
    expect(assetType.contract).toEqual("FLOW:A.7e60df042a9c0868.FlowToken")
  })
  test("get XTZ asset type from currency id", async () => {
    const assetType = getCurrencyAssetType(
      toCurrencyId("TEZOS:tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU"),
    ) as TezosXTZAssetType
    expect(assetType["@type"]).toEqual("XTZ")
  })
  test("get tezos_ft asset type from currency id", async () => {
    const assetType = getCurrencyAssetType(
      toCurrencyId("TEZOS:KT1Rgf9RNW7gLj7JGn98yyVM34S4St9eudMC:0"),
    ) as TezosFTAssetType
    expect(assetType["@type"]).toEqual("TEZOS_FT")
    expect(assetType.contract).toEqual("TEZOS:KT1Rgf9RNW7gLj7JGn98yyVM34S4St9eudMC")
    expect(assetType.tokenId).toEqual("0")
  })
  test("test getDataFromCurrencyId with ETH", async () => {
    const { blockchain, contract, tokenId } = getDataFromCurrencyId(
      toCurrencyId("ETHEREUM:0x0000000000000000000000000000000000000000"),
    )
    expect(blockchain).toEqual(Blockchain.ETHEREUM)
    expect(contract).toEqual("0x0000000000000000000000000000000000000000")
    expect(tokenId).toEqual(undefined)
  })
  test("test getDataFromCurrencyId with Ethereum ERC-20 contract", async () => {
    const { blockchain, contract, tokenId } = getDataFromCurrencyId(
      toCurrencyId("ETHEREUM:0x0000000000000000000000000000000000000001"),
    )
    expect(blockchain).toEqual(Blockchain.ETHEREUM)
    expect(contract).toEqual("0x0000000000000000000000000000000000000001")
    expect(tokenId).toEqual(undefined)
  })

  test("test convertCurrencyIdToAssetType", async () => {
    expect(convertCurrencyIdToAssetType(toCurrencyId("ETHEREUM:0x0000000000000000000000000000000000000000"))).toEqual({
      "@type": "ETH",
      blockchain: Blockchain.ETHEREUM,
    })
    expect(convertCurrencyIdToAssetType(toCurrencyId("POLYGON:0x0000000000000000000000000000000000000000"))).toEqual({
      "@type": "ETH",
      blockchain: Blockchain.POLYGON,
    })
    expect(convertCurrencyIdToAssetType(toCurrencyId("IMMUTABLEX:0x0000000000000000000000000000000000000000"))).toEqual(
      {
        "@type": "ETH",
        blockchain: Blockchain.IMMUTABLEX,
      },
    )
    expect(convertCurrencyIdToAssetType(toCurrencyId("ETHEREUM:0x1000000000000000000000000000000000000000"))).toEqual({
      "@type": "ERC20",
      contract: "ETHEREUM:0x1000000000000000000000000000000000000000",
    })
    expect(convertCurrencyIdToAssetType(toCurrencyId("POLYGON:0x2000000000000000000000000000000000000000"))).toEqual({
      "@type": "ERC20",
      contract: "POLYGON:0x2000000000000000000000000000000000000000",
    })
    expect(convertCurrencyIdToAssetType(toCurrencyId("IMMUTABLEX:0x3000000000000000000000000000000000000000"))).toEqual(
      {
        "@type": "ERC20",
        contract: "IMMUTABLEX:0x3000000000000000000000000000000000000000",
      },
    )
    expect(convertCurrencyIdToAssetType(toCurrencyId("SOLANA:0x0000000000000000000000000000000000000000"))).toEqual({
      "@type": "SOLANA_SOL",
    })
    expect(convertCurrencyIdToAssetType(toCurrencyId("TEZOS:tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU"))).toEqual({
      "@type": "XTZ",
    })
  })

  test("get eth asset type from aptos currency id", async () => {
    const assetType = getCurrencyAssetType(toCurrencyId("APTOS:0x1::aptos_coin::AptosCoin")) as NativeCurrencyAssetType
    expect(assetType["@type"]).toEqual("CURRENCY_NATIVE")
    expect(assetType.blockchain).toEqual("APTOS")
  })

  test("get eth asset type from base64 encoded aptos currency id", async () => {
    const assetType = getCurrencyAssetType(
      toCurrencyId("APTOS:MHgxOjphcHRvc19jb2luOjpBcHRvc0NvaW4="),
    ) as NativeCurrencyAssetType
    expect(assetType["@type"]).toEqual("CURRENCY_NATIVE")
    expect(assetType.blockchain).toEqual("APTOS")
  })

  test("get eth asset type from base64-like string", async () => {
    const assetType = getCurrencyAssetType(
      toCurrencyId("APTOS:0x000000000000000000000000000000000000000000000000000000000001234"),
    ) as TokenCurrencyAssetType
    expect(assetType["@type"]).toEqual("CURRENCY_TOKEN")
    expect(assetType.contract).toEqual("APTOS:0x000000000000000000000000000000000000000000000000000000000001234")
  })
})
