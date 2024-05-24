import { Box } from "@mui/material"
import type { WalletType } from "@rarible/sdk-wallet"
import { useParams } from "react-router-dom"
import { Page } from "../../components/page"
import { CommentedBlock } from "../../components/common/commented-block"
import { FormStepper } from "../../components/common/form-stepper"
import { RequestResult } from "../../components/common/request-result"
import { TransactionInfo } from "../../components/common/transaction-info"
import { useSdkContext } from "../../components/connector/sdk"
import { UnsupportedBlockchainWarning } from "../../components/common/unsupported-blockchain-warning"
import { AcceptBidPrepareForm } from "./acceptbid-prepare-form"
import { AcceptBidForm } from "./acceptbid-form"
import { AcceptBidComment } from "./comments/accepbid-comment"

function validateConditions(blockchain: WalletType | undefined): boolean {
  return !!blockchain
}

export function AcceptBidPage() {
  const params = useParams()
  const connection = useSdkContext()
  const blockchain = connection.sdk.wallet?.walletType

  return (
    <Page header="Accept Bid">
      {!validateConditions(blockchain) && (
        <CommentedBlock sx={{ my: 2 }}>
          <UnsupportedBlockchainWarning blockchain={blockchain} />
        </CommentedBlock>
      )}
      <CommentedBlock sx={{ my: 2 }} comment={<AcceptBidComment />}>
        <FormStepper
          steps={[
            {
              label: "Get Order Info",
              render: onComplete => {
                return (
                  <AcceptBidPrepareForm
                    onComplete={onComplete}
                    disabled={!validateConditions(blockchain)}
                    orderId={params.orderId}
                  />
                )
              },
            },
            {
              label: "Send Transaction",
              render: (onComplete, lastResponse) => {
                return (
                  <AcceptBidForm
                    onComplete={onComplete}
                    prepare={lastResponse}
                    disabled={!validateConditions(blockchain)}
                  />
                )
              },
            },
            {
              label: "Done",
              render: (onComplete, lastResponse) => {
                return (
                  <RequestResult
                    result={{ type: "complete", data: lastResponse }}
                    completeRender={data => (
                      <Box sx={{ my: 2 }}>
                        <TransactionInfo transaction={data} />
                      </Box>
                    )}
                  />
                )
              },
            },
          ]}
        />
      </CommentedBlock>
    </Page>
  )
}
