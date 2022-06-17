import React from 'react';
import { WealthTaxBracket } from './WealthTaxBracket';

export class WealthTaxSchedule extends React.Component {
    render() {
        return(
            <table className="table align-middle tax-brackets">
                <thead>
                    <tr>
                        <th scope="col" className="ps-0" style={{width: '50%'}}>Threshold (millions of $)</th>
                        <th scope="col" className="ps-0" style={{width: '50%'}}>Marginal tax rate (%)</th>
                        <th scope="col" className="px-0"></th>
                    </tr>
                </thead>
                <tbody>
                {
                    this.props.thresholds.map((threshold, i) =>
                        <WealthTaxBracket
                            key={i}
                            threshold={this.props.thresholds[i]}
                            marginalRate={this.props.marginalRates[i]}
                            popImpacted={this.props.popImpacted[i]}
                            handleChangeThreshold={this.props.handleChangeThreshold[i]}
                            handleChangeMarginalRate={this.props.handleChangeMarginalRate[i]}
                            onClickRemove={this.props.removeBracket[i]}
                            removeDisabled={this.props.thresholds.length === 1}
                        />
                    )
                }
                </tbody>
            </table>
        );
    }
}
