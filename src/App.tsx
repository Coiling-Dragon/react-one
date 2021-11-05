import * as React from "react";
import styled from "styled-components";

import Web3Modal from "web3modal";
// @ts-ignore
import WalletConnectProvider from "@walletconnect/web3-provider";
import Column from "./components/Column";
import Wrapper from "./components/Wrapper";
import Header from "./components/Header";
import Loader from "./components/Loader";
import ConnectButton from "./components/ConnectButton";
import Button from "./components/Button";
import Input from "./components/Input";

import { Web3Provider } from "@ethersproject/providers";
import { getChainData } from "./helpers/utilities";

import { GREETER_ADDRESS } from "./constants";
import { GREETER_ABI } from "./constants";
import { getContract } from "./helpers/ethers";

const SLayout = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  text-align: center;
`;

const SContent = styled(Wrapper)`
  width: 100%;
  height: 100%;
  padding: 0 16px;
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SLanding = styled(Column)`
  height: 600px;
`;

// @ts-ignore
const SBalances = styled(SLanding)`
  height: 100%;
  & h3 {
    padding-top: 30px;
  }
`;

interface IAppState {
  fetching: boolean;
  address: string;
  library: any;
  connected: boolean;
  chainId: number;
  pendingRequest: boolean;
  result: any | null;
  greeterContract: any | null;
  info: any | null;
  inputName: string;
  greeting: any | null;
  transactionHash: any | null;
}

const INITIAL_STATE: IAppState = {
  fetching: false,
  address: "",
  library: null,
  connected: false,
  chainId: 1,
  pendingRequest: false,
  result: null,
  greeterContract: null,
  info: null,
  inputName: "",
  greeting: null,
  transactionHash: null,
};

class App extends React.Component<any, any> {
  // @ts-ignore
  public web3Modal: Web3Modal;
  public state: IAppState;
  public provider: any;

  constructor(props: any) {
    super(props);
    this.state = {
      ...INITIAL_STATE,
    };

    this.web3Modal = new Web3Modal({
      network: this.getNetwork(),
      cacheProvider: true,
      providerOptions: this.getProviderOptions(),
    });
  }

  public componentDidMount() {
    if (this.web3Modal.cachedProvider) {
      this.onConnect();
    }
  }

  public onConnect = async () => {
    this.provider = await this.web3Modal.connect();

    const library = new Web3Provider(this.provider);

    const network = await library.getNetwork();

    const address = this.provider.selectedAddress
      ? this.provider.selectedAddress
      : this.provider?.accounts[0];

    // const signer = library.getSigner()
    // // tslint:disable-next-line:no-console
    // console.log("Account:", await signer.getAddress());

    await this.subscribeToProviderEvents(this.provider);

    const greeterContract = getContract(
      GREETER_ADDRESS,
      GREETER_ABI,
      library,
      address
    );

    await this.setState({
      library,
      chainId: network.chainId,
      address,
      connected: true,
      greeterContract,
    });
  };

  public subscribeToProviderEvents = async (provider: any) => {
    if (!provider.on) {
      return;
    }

    provider.on("accountsChanged", this.changedAccount);
    provider.on("networkChanged", this.networkChanged);
    provider.on("close", this.close);

    await this.web3Modal.off("accountsChanged");
  };

  public async unSubscribe(provider: any) {
    // Workaround for metamask widget > 9.0.3 (provider.off is undefined);
    window.location.reload(false);
    if (!provider.off) {
      return;
    }

    provider.off("accountsChanged", this.changedAccount);
    provider.off("networkChanged", this.networkChanged);
    provider.off("close", this.close);
  }

  public changedAccount = async (accounts: string[]) => {
    if (!accounts.length) {
      // Metamask Lock fire an empty accounts array
      await this.resetApp();
    } else {
      await this.setState({ address: accounts[0] });
    }
  };

  public networkChanged = async (networkId: number) => {
    const library = new Web3Provider(this.provider);
    const network = await library.getNetwork();
    const chainId = network.chainId;
    await this.setState({ chainId, library });
  };

  public close = async () => {
    this.resetApp();
  };

  public getNetwork = () => getChainData(this.state.chainId).network;

  public getProviderOptions = () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID,
        },
      },
    };
    return providerOptions;
  };

  public resetApp = async () => {
    await this.web3Modal.clearCachedProvider();
    localStorage.removeItem("WEB3_CONNECT_CACHED_PROVIDER");
    localStorage.removeItem("walletconnect");
    await this.unSubscribe(this.provider);

    this.setState({ ...INITIAL_STATE });
  };

  public currentGreeting = async () => {
    const { greeterContract } = this.state;
    // if .greeterContract; = undefined because of unpacking
    const greeting = await greeterContract.greet();

    // tslint:disable-next-line:no-console
    console.log(greeting);
    await this.setState({ greeting });
  };

  public showGreetingHandler = async () => {
    await this.setState({ fetching: true });
    this.currentGreeting();
    await this.setState({ fetching: false });
  };

  public changeGreetingInputHandler = (strValue: string) => {
    // const target = event.target as HTMLInputElement;
    // tslint:disable-next-line:no-console
    // console.log(strValue);
    this.setState({
      inputName: strValue,
    });
  };

  public handleSubmit = async (event: any) => {
    event.preventDefault();

    // tslint:disable-next-line:no-console
    // console.log(this.state.greeterContract);

    // tslint:disable-next-line:no-console
    // console.log(event.target.name.value, this.state.inputName);

    this.setState({ fetching: true });
    const transactionSetGreeting = await this.state.greeterContract.setGreeting(
      this.state.inputName
    );
    this.setState({ transactionHash: transactionSetGreeting.hash });
    const transactionSetGreetingReceipt = await transactionSetGreeting.wait();
    if (transactionSetGreetingReceipt.status !== 1) {
      alert("Transaction faild");
      return;
    }
    await this.setState({ fetching: false });
  };

  public render = () => {
    const { address, connected, chainId, fetching } = this.state;
    return (
      <SLayout>
        <Column maxWidth={1000} spanHeight>
          <Header
            connected={connected}
            address={address}
            chainId={chainId}
            killSession={this.resetApp}
          />
          <SContent>
            {fetching ? (
              <Column center>
                <SContainer>
                  <p>TXN:{this.state.transactionHash}</p>
                  <Loader />
                </SContainer>
              </Column>
            ) : (
              <SLanding center>
                {!connected ? (
                  <ConnectButton onClick={this.onConnect} />
                ) : (
                  <SContent>
                    <Column spanHeight={false}>
                      <h5>
                        {this.state.greeting
                          ? this.state.greeting
                          : "This is a greeting"}
                      </h5>
                      <Button onClick={this.showGreetingHandler}>
                        Show Greeting
                      </Button>
                      <p>TXN:{this.state.transactionHash}</p>
                    </Column>
                    <Column>
                      <form
                        name={"myform"}
                        onSubmit={() => {
                          this.handleSubmit(event);
                        }}
                      >
                        <Input
                          type="text"
                          id="name"
                          name="name"
                          placeholder="Change creeting"
                          handleChange={this.changeGreetingInputHandler}
                          value={this.state.inputName}
                        />
                        <span>{" "}</span>
                        <Button type={"submit"}>Change Greeting</Button>
                      </form>
                    </Column>
                  </SContent>
                )}
              </SLanding>
            )}
          </SContent>
        </Column>
      </SLayout>
    );
  };
}

export default App;
