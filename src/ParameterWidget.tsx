import * as React from 'react';
import { Parameter, ValueParameter, NumberDefinition, BangParameter, InvalidParameter } from 'rabbitcontrol';
import { GroupParameter } from 'rabbitcontrol';
import { NumberParameter } from 'rabbitcontrol';

type Props = {
    parameter: Parameter;
    onSubmitCb: () => void;
};

type State = {
    enabled: boolean,
    label?: string,
    description?: string,
    value: any,
};

export default class ParameterWidget extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        let value;
        if (this.props.parameter instanceof ValueParameter && 
            this.props.parameter.value != null)
        {
            value = this.props.parameter.value;
        }

        this.state = {
            enabled: true,
            label: this.props.parameter.label,
            description: this.props.parameter.description,
            value: value,
        };

        this.handleValueChange = this.handleValueChange.bind(this);
        this.handleValueSubmit = this.handleValueSubmit.bind(this);
    }

    componentDidMount() {

        // setup callbacks
        const param = this.props.parameter;

        if (param instanceof ValueParameter) {
            param.addValueChangeListener((p) => {
                if (p instanceof ValueParameter) {
                    this.setState({
                        value: p.value
                    });
                }
            });
        }

        param.addChangeListener((p) => {
            this.setState({
                label: p.label,
                description: p.description,
                enabled: p.readonly ? true : false,
            })
        });
    }

    createChildWidget(param: Parameter, submitCb: () => void): any {
        return (
            <ParameterWidget key={param.id}
                parameter={param} 
                onSubmitCb={submitCb}
            />
        );
    }

    renderChildren(parameter: Parameter) {
        if (parameter instanceof GroupParameter) {
            return (parameter as GroupParameter).children.map( (p) => { return this.createChildWidget(p, this.props.onSubmitCb); });
        }

        return <div />
    }

    handleValueChange(value: any) {
        this.setState({ value: value });
    }

    handleValueSubmit(event: any) {
        //
        console.log("submit");
        if (event && event.preventDefault) {
            event.preventDefault();
        }        
        if (this.props.parameter instanceof ValueParameter) {
            if (this.props.parameter.setStringValue(this.state.value)) {
                // call onsubmitcb to update client
                this.props.onSubmitCb();
            } else {
                // set string value failed... 
                this.setState({ value: this.props.parameter.value });
            }
        }
    }

    handleButtonClick = () => {
        this.props.parameter.setDirty();
        this.props.onSubmitCb();        
    }

    getDefaultTextInput() {
        return (
            <section>
                <form style={{
                        width: "100%",
                    }}
                    onSubmit={this.handleValueSubmit}
                >
                    <input 
                        type="text"
                        onChange={(e) => {this.handleValueChange(e.target.value);}} 
                        value={this.state.value} 
                        width="100%"
                    />
                    </form>
            </section>
        );
    }

    renderValue() {

        const param = this.props.parameter;        

        if (param instanceof ValueParameter) {

            if (param instanceof NumberParameter) {

                const numdef = param.typeDefinition as NumberDefinition;

                if (numdef.minimum && numdef.maximum) {
                    // default element could be a slider / dial, etc
                }

                return this.getDefaultTextInput();

            } else {
                return this.getDefaultTextInput();
            }
        } else if (param instanceof GroupParameter) {
            return (
                <b>group</b>
            );
        } else if (param instanceof BangParameter) {
            return (
                <button onClick={this.handleButtonClick}>{`${param.label}`}</button>
            );
        } else if (param instanceof InvalidParameter) {
            return (
                <b>INVALID PARAMETER !</b>
            );
        } 

        return (
            <p>
                {`not handled parameter: ${param.id} with datatype ${param.typeDefinition.datatype}`}
            </p>
        );
    }

    render() {

        const label = this.state.label ? this.state.label : "no label";
        const param = this.props.parameter;

        if (!param) {            
            return;
        }

        return (
            <section>
            
                <div style={{
                    marginTop: 20,
                    marginBottom: 20,
                }}>
                    {label} ({param.id}):&nbsp;
                    {this.renderValue()}
                </div>

                <div id="children">
                    {this.renderChildren(param)}
                </div>

                <hr style={{
                    color: "gray",
                    borderTop: "1px solid #ccc",
                }}/>
            </section>
        );
    }
}