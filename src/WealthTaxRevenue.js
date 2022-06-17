import React from 'react';

export class WealthTaxRevenue extends React.Component {
    render() {
        return(
            <div className="table-responsive p-0">
                <table className="table align-middle tax-revenue">
                    <thead>
                        <tr>
                            <th scope="col" rowSpan="2">Bracket</th>
                            <th scope="col" colSpan="2">People (% of adult pop.)</th>
                            <th scope="col" colSpan="2">Revenue (% of national income)</th>
                        </tr>
                        <tr>
                            <th scope="col">Short-Run</th>
                            <th scope="col">Long-Run</th>
                            <th scope="col">Short-Run</th>
                            <th scope="col">Long-Run</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.props.thresholds.map((threshold, i) =>
                                <tr key={i}>
                                    <td>${this.props.thresholds[i]}m</td>
                                    <td>{(100*this.props.popShortRun[i]).toPrecision(2)}%</td>
                                    <td>{(100*this.props.popLongRun[i]).toPrecision(2)}%</td>
                                    <td>{(100*this.props.taxRevenueShortRun[i]).toPrecision(2)}%</td>
                                    <td>{(100*this.props.taxRevenueLongRun[i]).toPrecision(2)}%</td>
                                </tr>
                            )
                        }
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>Total</td>
                            <td>{(100*this.props.totalPopShortRun).toPrecision(2)}%</td>
                            <td>{(100*this.props.totalPopLongRun).toPrecision(2)}%</td>
                            <td>{(100*this.props.totalTaxRevenueShortRun).toPrecision(2)}%</td>
                            <td>{(100*this.props.totalTaxRevenueLongRun).toPrecision(2)}%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    }
}
