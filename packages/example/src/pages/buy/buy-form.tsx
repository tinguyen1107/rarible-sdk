import { useForm } from "react-hook-form"
import type { Order } from "@rarible/api-client"
import { Box, Stack } from "@mui/material"
import type { PrepareFillResponse } from "@rarible/sdk/build/types/order/fill/domain"
import { toItemId, toUnionAddress } from "@rarible/types"
import { FormSubmit } from "../../components/common/form/form-submit"
import { resultToState, useRequestResult } from "../../components/hooks/use-request-result"
import { RequestResult } from "../../components/common/request-result"
import { FillRequestForm } from "../../components/common/sdk-forms/fill-request-form"

interface IBuyFormProps {
  prepare: PrepareFillResponse
  order: Order
  disabled?: boolean
  onComplete: (response: any) => void
}

export function BuyForm({ prepare, order, disabled, onComplete }: IBuyFormProps) {
  const form = useForm()
  const { result, setError } = useRequestResult()
  console.log("debug prepare", JSON.stringify(prepare))

  return (
    <>
      <form
        onSubmit={form.handleSubmit(async formData => {
          try {
            onComplete(
              await prepare.submit({
                amount: parseInt(formData.amount),
                itemId: formData.itemId ? toItemId(formData.itemId) : undefined,
                payouts: [
                  {
                    account: toUnionAddress("ETHEREUM:0x39Befa60e7991f22F6917A8eC81C90f34Ef606D1"),
                    value: 3000,
                  },
                  {
                    account: toUnionAddress("ETHEREUM:0xf72A95B74220575d281F561ab7E51d4188230db3"),
                    value: 7000,
                  },
                ],
                originFees: [
                  {
                    account: toUnionAddress("ETHEREUM:0x4ECc1ab8e265680b876F62e3CfaEe893D0a2B82D"),
                    value: 1357,
                  },
                ],
              }),
            )
          } catch (e) {
            setError(e)
          }
        })}
      >
        <Stack spacing={2}>
          <div>baseFee: {prepare.baseFee}</div>
          <FillRequestForm form={form} prepare={prepare} order={order} />
          <Box>
            <FormSubmit form={form} label="Submit" state={resultToState(result.type)} disabled={disabled} />
          </Box>
        </Stack>
      </form>
      <Box sx={{ my: 2 }}>
        <RequestResult result={result} />
      </Box>
    </>
  )
}
