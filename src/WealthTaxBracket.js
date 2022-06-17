import React from 'react';

export class WealthTaxBracket extends React.Component {
    render() {
        return(
            <tr>
                <td className="ps-0">
                    <input
                        type="number"
                        className="form-control"
                        value={this.props.threshold}
                        onChange={this.props.handleChangeThreshold}
                        step="0.1"
                        min="0"
                        placeholder="E.g., 50 to mean $50m"
                    />
                </td>
                <td className="ps-0">
                    <input
                        type="number"
                        className="form-control"
                        value={this.props.marginalRate}
                        onChange={this.props.handleChangeMarginalRate}
                        step="0.1"
                        min="0"
                        max="99"
                        placeholder="E.g., 2 to mean 2%"
                    />
                </td>
                <td className="px-0">
                    <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={this.props.removeDisabled}
                        onClick={this.props.onClickRemove}
                    >
                        <i className="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        );
    }
}
