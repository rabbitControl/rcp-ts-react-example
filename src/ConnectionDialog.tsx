import * as React from 'react';
import { Client, Parameter, WebSocketClientTransporter } from 'rabbitcontrol';
import ParameterWidget from './ParameterWidget';

type Props = {
};

type State = {
    isConnected: boolean;
    error: string | null;
    client: Client | null;
    host: string;
    port: number;
    parameters: Parameter[];
};

export default class ConnectionDialog extends React.Component<Props, State> {
    
    private addTimer?: number;
    private removeTimer?: number;
    private myParameters: Parameter[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            isConnected: false,
            error: null,
            client: null,
            host: window.location.hostname || 'localhost',
            port: 10000,
            parameters: [],
        };
    }

    setHost = (e: any) => {
        this.setState({
            host: e.currentTarget.value || "localhost",
        });
    }

    setPort = (e: any) => {
        this.setState({
            port: parseInt(e.currentTarget.value, 10)
        });
    }

    updateClient = () => {
        if (this.state.client) {
            this.state.client.update();
        }
    }

    createParameterWidget(param: Parameter) {
        return (
            <ParameterWidget key={param.id}
                parameter={param} 
                onSubmitCb={this.updateClient}
            />
        );
    }

    createWidgets(parameter: Parameter[]) {
        return parameter.map( (param) => { return this.createParameterWidget(param); });
    }

    render() {

        const isConnected = this.state.isConnected;
        const host = this.state.host;
        const port = this.state.port;
        const buttonInfo = isConnected ? "Disconnect" : "Connect";
        const buttonFunc = isConnected ? this.doDisconnect : this.doConnect;

        return (
        <section style={{
            marginLeft: 20, 
            marginRight: 20,
            marginTop: 10,
        }}>

            <input className="bp3-input" type='text' value={host} onChange={this.setHost} />
            &nbsp;
            <input className="bp3-input" type='text' value={port} onChange={this.setPort} />
            &nbsp;
            <button onClick={() =>{buttonFunc();}}>{buttonInfo}</button>
            <br/>
            {this.state.error ? this.state.error : ""}

            <hr/>

            <div id="widgets">
                {this.createWidgets(this.state.parameters)}
            </div>
        
        </section>
        );
    }

    resetUI() {

        this.stopTimers();

        this.myParameters = [];

        this.setState({
            isConnected: false, 
            client: null, 
            parameters: this.myParameters,
        });
    }

    doDisconnect = () => {
        console.log("DO DISCONNECT");
        
        if (this.state.client) {
            this.state.client.dispose();            
        }
    }

    doConnect = () => {

        // enable to turn on debug logging in client
        // Client.VERBOSE = true;

        // only turn on DO_VALUE_UPDATE if you know your server supports this feature
        // Client.DO_VALUE_UPDATE = true;

        // create new client
        const client = new Client(new WebSocketClientTransporter());

        const { connected, disconnected, parameterAdded, parameterRemoved, onError } = this;
        Object.assign(client, { connected, disconnected, parameterAdded, parameterRemoved, onError });

        const host = this.state.host;
        const port = this.state.port;

        client.connect(host, port);
        this.setState({ 
            client, error: null
        });
    }

    connected = () => {
        this.setState({
            isConnected: true
        });
    }

    disconnected = (event: CloseEvent) => {
        console.log("ConnectionDialog disconneted: " + JSON.stringify(event));
        this.setState({
            error: `socket disconnected${event.wasClean ? "" : "(code: " + event.code + "): " + JSON.stringify(event.reason)}`
        });
        this.resetUI();
    }

    onError = () => {
        this.setState({
            error: "error on socket!"
        });
        this.resetUI();
    }

    /**
     * called when a parameter was added
     * add the parameter to draw ui element
     */
    parameterAdded = (parameter: Parameter) => {

        // addUI(parameter);
        if (!parameter.parent) {    
            const params = this.myParameters.slice();
            params.push(parameter);
            this.myParameters = params;
        }

        // deferer setstate
        if (this.addTimer !== undefined) {
            window.clearTimeout(this.addTimer);
            this.addTimer = undefined;
        }

        this.addTimer = window.setTimeout(() => {
            this.setState({
                parameters: this.myParameters
            });
        }, 100);
    }

    /**
     * called when a parameter was removed
     * remove parameter to also remove ui element
     */
    parameterRemoved = (parameter: Parameter) => {
        
        const index = this.myParameters.indexOf(parameter, 0);
        if (index > -1) {
            const params = this.myParameters.splice(index, 1);
            this.myParameters = params;
        }

        if (this.removeTimer!== undefined) {
            window.clearTimeout(this.removeTimer);
            this.removeTimer = undefined;
        }

        this.removeTimer = window.setTimeout(() => {
            this.setState({
                parameters: this.myParameters,
            });
        }, 100);
    }

    private stopTimers() {

        // deferer setstate
        if (this.addTimer !== undefined) {
            window.clearTimeout(this.addTimer);
            this.addTimer = undefined;
        }

        if (this.removeTimer!== undefined) {
            window.clearTimeout(this.removeTimer);
            this.removeTimer = undefined;
        }
    }

} 
