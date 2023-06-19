import { NetworkType as TezosNetwork } from "@airgap/beacon-sdk"
import type { RaribleSdkEnvironment } from "@rarible/sdk/build/config/domain"
import type {
	ConnectionProvider,
	IConnectorStateProvider } from "@rarible/connector"
import {
	Connector,
	InjectedWeb3ConnectionProvider,
} from "@rarible/connector"
import { FclConnectionProvider } from "@rarible/connector-fcl"
import { MEWConnectionProvider } from "@rarible/connector-mew"
import { NFIDConnectionProvider } from "@rarible/connector-nfid"
import { BeaconConnectionProvider } from "@rarible/connector-beacon"
import { TorusConnectionProvider } from "@rarible/connector-torus"
import { WalletLinkConnectionProvider } from "@rarible/connector-walletlink"
import { WalletConnectConnectionProvider } from "@rarible/connector-walletconnect"
import { PhantomConnectionProvider } from "@rarible/connector-phantom"
import { SolflareConnectionProvider } from "@rarible/connector-solflare"
import type { IWalletAndAddress } from "@rarible/connector-helper"
import {
	mapEthereumWallet,
	mapFlowWallet,
	mapImmutableXWallet,
	mapSolanaWallet,
	mapTezosWallet,
} from "@rarible/connector-helper"
import { ImmutableXLinkConnectionProvider } from "@rarible/connector-immutablex-link"
import { MattelConnectionProvider } from "@rarible/connector-mattel"
// import { FortmaticConnectionProvider } from "@rarible/connector-fortmatic"
// import { PortisConnectionProvider } from "@rarible/connector-portis"

const ethereumRpcMap: Record<number, string> = {
	1: "https://node-mainnet.rarible.com",
	3: "https://node-ropsten.rarible.com",
	4: "https://node-rinkeby.rarible.com",
	5: "https://goerli-ethereum-node.rarible.com",
	17: "https://node-e2e.rarible.com",
	137: "https://polygon-rpc.com",
	80001: "https://rpc-mumbai.matic.today",
}

const ethereumNetworkMap: Record<number, string> = {
	1: "mainnet",
	3: "ropsten",
	4: "rinkeby",
	5: "goerli",
	17: "e2e",
	137: "polygon",
	80001: "mumbai",
}

function environmentToEthereumChainId(environment: RaribleSdkEnvironment) {
	switch (environment) {
		case "prod":
			return 1
		case "testnet":
		default:
			return 5
	}
}

function environmentToFlowNetwork(environment: RaribleSdkEnvironment) {
	switch (environment) {
		case "prod":
			return {
				network: "mainnet",
				accessNode: "https://access.onflow.org",
				walletDiscovery: "https://flow-wallet.blocto.app/authn",
			}
		case "testnet":
		default:
			return {
				network: "testnet",
				accessNode: "https://access-testnet.onflow.org",
				walletDiscovery: "https://flow-wallet-testnet.blocto.app/authn",
			}
	}
}

function environmentToTezosNetwork(environment: RaribleSdkEnvironment) {
	switch (environment) {
		case "prod":
			return {
				accessNode: "https://rpc.tzkt.io/mainnet",
				network: TezosNetwork.MAINNET,
			}
		case "development":
			return {
				accessNode: "https://rpc.tzkt.io/ghostnet",
				network: TezosNetwork.CUSTOM,
			}
		case "testnet":
		default:
			return {
				accessNode: "https://rpc.tzkt.io/ghostnet",
				network: TezosNetwork.CUSTOM,
			}
	}
}

function environmentToImmutableXEnv(environment: RaribleSdkEnvironment) {
	switch (environment) {
		case "prod":
			return "prod"
		default:
			return "testnet"
	}
}

const state: IConnectorStateProvider = {
	async getValue(): Promise<string | undefined> {
		const value = localStorage.getItem("saved_provider")
		return value ? value : undefined
	},
	async setValue(value: string | undefined): Promise<void> {
		localStorage.setItem("saved_provider", value || "")
	},
}

export function getConnector(environment: RaribleSdkEnvironment) {
	const ethChainId = environmentToEthereumChainId(environment)
	const ethNetworkName = ethereumNetworkMap[ethChainId]
	const isEthNetwork = ["mainnet", "goerli"].includes(ethNetworkName)
	const flowNetwork = environmentToFlowNetwork(environment)
	const tezosNetwork = environmentToTezosNetwork(environment)

	const injected = mapEthereumWallet(new InjectedWeb3ConnectionProvider())

	const mew = mapEthereumWallet(new MEWConnectionProvider({
		networkId: ethChainId,
		rpcUrl: ethereumRpcMap[ethChainId],
	}))

	const nfid = mapEthereumWallet(new NFIDConnectionProvider({
		origin: process.env.REACT_APP_NFID_ORIGIN || "https://nfid.one",
	}))

	const beacon: ConnectionProvider<"beacon", IWalletAndAddress> = mapTezosWallet(new BeaconConnectionProvider({
		appName: "Rarible Test",
		accessNode: tezosNetwork.accessNode,
		network: tezosNetwork.network,
	}))

	const fcl = mapFlowWallet(new FclConnectionProvider({
		accessNode: flowNetwork.accessNode,
		walletDiscovery: flowNetwork.walletDiscovery,
		network: flowNetwork.network,
		applicationTitle: "Rari Test",
		applicationIcon: "https://rarible.com/favicon.png?2d8af2455958e7f0c812",
	}))

	const magic = mapFlowWallet(new MattelConnectionProvider({
		magicProviderId: "JeTIUJ7GJNnfwnxMwtPRa7JzbzRVxA4p3TdQsXryggM=",
		magicAPIKey: "pk_live_63A5A557D1D4882D",
		auth0Domain: "login-test.mattel.com",
		auth0ClientId: "nXpDI0BnWhxB5DIhQVGOrB2LwgOvKIhd",
		auth0RedirectUrl: "https://test-virtual.mattel.com",
		accessNode: flowNetwork.accessNode,
		network: flowNetwork.network,
	}) as any) as any

	let torus = undefined
	if (isEthNetwork) {
		torus = mapEthereumWallet(new TorusConnectionProvider({
			network: {
				host: ethNetworkName,
			},
		}))
	}

	const walletLink = mapEthereumWallet(new WalletLinkConnectionProvider({
		networkId: ethChainId,
		estimationUrl: ethereumRpcMap[ethChainId],
		url: ethereumRpcMap[ethChainId],
	}, {
		appName: "Rarible",
		appLogoUrl: "https://rarible.com/static/logo-500.static.png",
		darkMode: false,
	}))

	const walletConnect = mapEthereumWallet(new WalletConnectConnectionProvider({
		rpc: ethereumRpcMap,
		chainId: ethChainId,
	}))

	const phantomConnect = mapSolanaWallet(new PhantomConnectionProvider())
	const solflareConnect = mapSolanaWallet(new SolflareConnectionProvider({
		network: environment === "prod" ? "mainnet-beta" : "devnet",
	}))

	const imxConnector = mapImmutableXWallet(new ImmutableXLinkConnectionProvider({
		env: environmentToImmutableXEnv(environment),
	}))


	// Providers required secrets
	// const fortmatic = mapEthereumWallet(new FortmaticConnectionProvider({ apiKey: "ENTER", ethNetwork: { chainId: 4, rpcUrl: "https://node-rinkeby.rarible.com" } }))
	// const portis = mapEthereumWallet(new PortisConnectionProvider({ appId: "ENTER", network: "rinkeby" }))

	const connector = Connector
		.create(injected, state)
		.add(nfid)
		.add(walletLink)
		.add(mew)
		.add(beacon)
		.add(fcl)
		.add(walletConnect)
		.add(phantomConnect)
		.add(solflareConnect)
		.add(imxConnector)
		.add(magic)
	// .add(portis)
	// .add(fortmatic)

	if (torus) {
		return connector.add(torus)
	}

	return connector
}
