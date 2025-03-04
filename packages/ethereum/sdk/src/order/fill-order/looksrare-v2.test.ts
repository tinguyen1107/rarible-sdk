import type { LooksRareOrder } from "@rarible/ethereum-api-client"
import { createRaribleSdk } from "../../index"
import { createE2eTestProvider } from "../../common/test/create-test-providers"
import { DEV_PK_2, getE2EConfigByNetwork } from "../../common/test/test-credentials"

describe.skip("looksrare v2 fill tests", () => {
  const { web3v4Ethereum } = createE2eTestProvider(DEV_PK_2, getE2EConfigByNetwork("sepolia"))

  const env = "testnet" as const
  const sdkBuyer = createRaribleSdk(web3v4Ethereum, env)

  test("buy", async () => {
    const order = await sdkBuyer.apis.order.getValidatedOrderByHash({
      hash: "0x8e6c6f9acc448a3f736d31ca2dce2b32918d4c33c92e285a2c9095309f5e38d6",
    })
    const tx = await sdkBuyer.order.buy({
      order: order as LooksRareOrder,
      amount: 1,
      originFees: [],
    })
    console.log("tx", tx)
    await tx.wait()
  })
})
