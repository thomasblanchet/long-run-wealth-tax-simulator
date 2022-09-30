import React from 'react';
import { Toast } from 'bootstrap';

import { WealthTaxSchedule } from './WealthTaxSchedule';
import { WealthTaxRevenue } from './WealthTaxRevenue';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Scatter } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export class WealthTaxSimulator extends React.Component {
    constructor(props) {
        super(props);

        this.wealthData = require("./wealth-data.json");

        this.handleChangeTaxAvoidanceElasticity = this.handleChangeTaxAvoidanceElasticity.bind(this);
        this.handleChangeConsumptionElasticity = this.handleChangeConsumptionElasticity.bind(this);
        this.handleChangeMobilityAdjustment = this.handleChangeMobilityAdjustment.bind(this);
        this.handleChangeThreshold = this.handleChangeThreshold.bind(this);
        this.handleChangeMarginalRate = this.handleChangeMarginalRate.bind(this);

        this.estimateBaselineInequality();

        this.state = {
            thresholds: [50, 200, 500, 1000],
            marginalRates: [2, 4, 6, 10],
            consumptionElasticity: 1,
            taxAvoidanceElasticity: 1,
            mobilityAdjustment: 1
        };
    }
    estimateBaselineInequality() {
        let n = this.wealthData['weight'].length;
        this.shareTop10 = 0;
        this.shareTop5 = 0;
        this.shareTop1 = 0;
        this.shareTop01 = 0;
        this.shareTop001 = 0;
        let cumWeights = 0;
        for (let i = 0; i < n; i++) {
            let wgt = this.wealthData['weight'][n - i - 1];
            cumWeights += wgt;
            let p = 100*cumWeights/this.wealthData['population'];
            if (p < 0.01) {
                this.shareTop001 += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop01  += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop1   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop5   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else if (p < 0.1) {
                this.shareTop01  += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop1   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop5   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else if (p < 1) {
                this.shareTop1   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop5   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else if (p < 5) {
                this.shareTop5   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else if (p < 10) {
                this.shareTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else {
                break;
            }
        }
        this.shareTop10  = this.shareTop10  / this.wealthData['nationalWealth'];
        this.shareTop5   = this.shareTop5   / this.wealthData['nationalWealth'];
        this.shareTop1   = this.shareTop1   / this.wealthData['nationalWealth'];
        this.shareTop01  = this.shareTop01  / this.wealthData['nationalWealth'];
        this.shareTop001 = this.shareTop001 / this.wealthData['nationalWealth'];
    }
    resetBrackets() {
        this.setState({
            thresholds: [50, 200, 500, 1000],
            marginalRates: [2, 4, 6, 10]
        });
    }
    getSortedBrackets() {
        let n = this.state.thresholds.length;

        let thresholds = [];
        let marginalRates = [];
        for (let i = 0; i < n; i++) {
            if (this.state.thresholds[i] != null & this.state.marginalRates[i] != null) {
                thresholds.push(this.state.thresholds[i]);
                marginalRates.push(this.state.marginalRates[i]);
            }
        }
        n = thresholds.length;

        let indexes = new Array(n);
        indexes.fill(0);
        indexes = indexes.map((elem, i) => i);

        indexes = indexes.sort((i, j) => thresholds[i] - thresholds[j]);

        thresholds = indexes.map((idx, i) => thresholds[idx]);
        marginalRates = indexes.map((idx, i) => marginalRates[idx]);

        return({
            thresholds: thresholds,
            marginalRates: marginalRates,
        });
    }
    sortBrackets() {
        this.setState(this.getSortedBrackets());
    }
    taxAvoidance(mtr) {
        if (mtr >= 1) {
            return 0;
        } else if (mtr <= 0) {
            return 1;
        } else {
            return Math.pow(1 - mtr, this.state.taxAvoidanceElasticity);
        }
    }
    consumptionResponse(mtr) {
        if (mtr >= 1) {
            return Infinity;
        } else if (mtr <= 0) {
            return 0;
        } else {
            return Math.pow(1 - mtr, -this.state.consumptionElasticity) - 1;
        }
    }
    estimatePopAbove(threshold) {
        let indexesAbove = this.wealthData['wealth'].findIndex((w) => w > threshold);
        let popAbove = this.wealthData['weight'].slice(indexesAbove).reduce((x, y) => x + y, 0);
        return popAbove/this.wealthData['population'];
    }
    estimateDeclaredWealth(thresholds, marginalRates) {
        let n = this.wealthData['wealth'].length;
        let declaredWealth = this.wealthData['wealth'].slice();

        let k = 0;
        for (let i = 0; i < n; i++) {
            while (k + 1 < thresholds.length && this.wealthData['wealth'][i] >= thresholds[k + 1]) {
                k++;
            }
            if (this.wealthData['wealth'][i] >= thresholds[k]) {
                declaredWealth[i] = declaredWealth[i]*this.taxAvoidance(marginalRates[k]);
            }
        }
        return declaredWealth;
    }
    estimateExtraConsumption(thresholds, marginalRates) {
        let n = this.wealthData['wealth'].length;
        let extraConsumption = new Array(n);
        extraConsumption.fill(0);

        let k = 0;
        for (let i = 0; i < n; i++) {
            while (k + 1 < thresholds.length && this.wealthData['wealth'][i] >= thresholds[k + 1]) {
                k++;
            }
            if (this.wealthData['wealth'][i] >= thresholds[k]) {
                extraConsumption[i] = this.wealthData['consumption'][i]*this.consumptionResponse(marginalRates[k]);
            }
        }
        return extraConsumption;
    }
    estimateTaxPaid(thresholds, marginalRates, declaredWealth) {
        let n = declaredWealth.length;
        let taxPaid = new Array(n);
        taxPaid.fill(0);
        for (let k = 0; k < thresholds.length; k++) {
            for (let i = 0; i < n; i++) {
                if (k + 1 < thresholds.length && declaredWealth[i] >= thresholds[k + 1]) {
                    taxPaid[i] += (thresholds[k + 1] - thresholds[k])*marginalRates[k];
                } else if (declaredWealth[i] >= thresholds[k]) {
                    taxPaid[i] += (declaredWealth[i] - thresholds[k])*marginalRates[k];
                }
            }
        }
        return(taxPaid);
    }
    estimateLongRunWeights(taxPaid, extraConsumption) {
        let n = taxPaid.length;

        let longRunReweighting = new Array(n);
        longRunReweighting.fill(0);
        for (let i = 1; i < n; i++) {
            let dw = this.wealthData['wealth'][i] - this.wealthData['wealth'][i - 1];
            longRunReweighting[i] = longRunReweighting[i - 1] +
                2*(taxPaid[i] + extraConsumption[i])/Math.pow(this.state.mobilityAdjustment*this.wealthData['diffusion'][i], 2)*dw;
        }
        longRunReweighting = longRunReweighting.map((y) => Math.exp(-y));

        // New weights, rescaled to the population total
        let longRunWeights = this.wealthData['weight'].map(
            (w, i) => w*longRunReweighting[i]
        );
        let sumLongRunWeights = longRunWeights.reduce((x, y) => x + y, 0);
        longRunWeights = longRunWeights.map(
            (w) => w*(this.wealthData['population']/sumLongRunWeights)
        );
        return(longRunWeights);
    }
    estimateTaxStatistics(thresholds, marginalRates, taxPaid, longRunWeights) {
        let n = longRunWeights.length;

        this.longRunWealth = this.wealthData['wealth']
            .map((w, i) => w*longRunWeights[i])
            .reduce((x, y) => x + y, 0);

        this.taxRevenueShortRun = new Array(thresholds.length);
        this.taxRevenueShortRun.fill(0);
        this.taxRevenueLongRun = new Array(thresholds.length);
        this.taxRevenueLongRun.fill(0);
        this.popShortRun = new Array(thresholds.length);
        this.popShortRun.fill(0);
        this.popLongRun = new Array(thresholds.length);
        this.popLongRun.fill(0);

        this.avgMarginalRate = 0;

        let k = 0;
        for (let i = 0; i < n; i++) {
            while (k + 1 < thresholds.length && this.wealthData['wealth'][i] >= thresholds[k + 1]) {
                k++;
            }
            if (this.wealthData['wealth'][i] >= thresholds[k]) {
                this.popLongRun[k] += longRunWeights[i];
                this.popShortRun[k] += this.wealthData['weight'][i];

                this.taxRevenueLongRun[k] += taxPaid[i]*longRunWeights[i];
                this.taxRevenueShortRun[k] += taxPaid[i]*this.wealthData['weight'][i];

                this.avgMarginalRate += marginalRates[k]*this.wealthData['weight'][i];
            }
        }
        this.taxRevenueLongRun = this.taxRevenueLongRun.map((y, i) => y/this.wealthData['nationalIncome']);
        this.taxRevenueShortRun = this.taxRevenueShortRun.map((y, i) => y/this.wealthData['nationalIncome']);
        this.popLongRun = this.popLongRun.map((y, i) => y/this.wealthData['population']);
        this.popShortRun = this.popShortRun.map((y, i) => y/this.wealthData['population']);

        this.totalTaxRevenueLongRun = this.taxRevenueLongRun.reduce((x, y) => x + y, 0);
        this.totalTaxRevenueShortRun = this.taxRevenueShortRun.reduce((x, y) => x + y, 0);
        this.totalPopLongRun = this.popLongRun.reduce((x, y) => x + y, 0);
        this.totalPopShortRun = this.popShortRun.reduce((x, y) => x + y, 0);

        this.avgMarginalRate = this.avgMarginalRate/(this.totalPopShortRun*this.wealthData['population']);

        // Zap small values
        this.taxRevenueLongRun = this.taxRevenueLongRun.map((y) => y < 1e-8 ? 0 : y);
        this.taxRevenueShortRun = this.taxRevenueShortRun.map((y) => y < 1e-8 ? 0 : y);
        this.popLongRun = this.popLongRun.map((y) => y < 1e-8 ? 0 : y);
        this.popShortRun = this.popShortRun.map((y) => y < 1e-8 ? 0 : y);
    }
    estimateLongRunInequality(taxPaid, longRunWeights) {
        let n = longRunWeights.length;

        this.shareLongRunTop10 = 0;
        this.shareLongRunTop5 = 0;
        this.shareLongRunTop1 = 0;
        this.shareLongRunTop01 = 0;
        this.shareLongRunTop001 = 0;
        let cumWeights = 0;
        for (let i = 0; i < n; i++) {
            let wgt = longRunWeights[n - i - 1];
            cumWeights += wgt;
            let p = 100*cumWeights/this.wealthData['population'];
            if (p < 0.01) {
                this.shareLongRunTop001 += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop01  += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop1   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop5   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else if (p < 0.1) {
                this.shareLongRunTop01  += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop1   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop5   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else if (p < 1) {
                this.shareLongRunTop1   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop5   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else if (p < 5) {
                this.shareLongRunTop5   += wgt*this.wealthData['wealth'][n - i - 1];
                this.shareLongRunTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else if (p < 10) {
                this.shareLongRunTop10  += wgt*this.wealthData['wealth'][n - i - 1];
            } else {
                break;
            }
        }
        this.shareLongRunTop10  = this.shareLongRunTop10  / this.longRunWealth;
        this.shareLongRunTop5   = this.shareLongRunTop5   / this.longRunWealth;
        this.shareLongRunTop1   = this.shareLongRunTop1   / this.longRunWealth;
        this.shareLongRunTop01  = this.shareLongRunTop01  / this.longRunWealth;
        this.shareLongRunTop001 = this.shareLongRunTop001 / this.longRunWealth;
    }
    makeInequalityChart() {
        this.inequalityChartOptions = {
            responsive: true,
            aspectRatio: 1.3,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: "white",
                        font: {
                            size: 12,
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';

                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toPrecision(2);
                                label += "%";
                            }
                            return label;
                        }
                    }
                },
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        color: '#94d2bdff',
                        borderColor: '#94d2bdff',
                        tickColor: '#94d2bdff',
                        borderWidth: 1,
                        lineWidth: 1,
                    },
                    ticks: {
                        color: "white",
                        font: {
                            size: 10,
                        }
                    },
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: "% of total wealth",
                        color: "white",
                        font: {
                            size: 12,
                        }
                    },
                    grid: {
                        color: '#94d2bdff',
                        borderColor: '#94d2bdff',
                        tickColor: '#94d2bdff',
                        borderWidth: 1,
                        lineWidth: 1,
                    },
                    ticks: {
                        color: "white",
                        font: {
                            size: 10,
                        }
                    },
                },
            },
        };

        const labels = ['Top 10%', 'Top 5%', 'Top 1%', 'Top 0.1%', 'Top 0.01%'];
        this.inequalityChartData = {
            labels,
            datasets: [
                {
                    label: 'Current wealth share',
                    data: [this.shareTop10, this.shareTop5, this.shareTop1,
                        this.shareTop01, this.shareTop001].map((x, i) => 100*x),
                    backgroundColor: '#005f73',
                    stack: '0',
                },
                {
                    label: 'In the long run, with the wealth tax',
                    data: [this.shareLongRunTop10, this.shareLongRunTop5,
                        this.shareLongRunTop1, this.shareLongRunTop01,
                        this.shareLongRunTop001].map((x, i) => 100*x),
                    backgroundColor: '#e76f51',
                    stack: '1',
                },
            ],
        };
    }
    estimateLafferCurve(thresholds, marginalRates) {
        let n = this.wealthData['wealth'].length;

        // Predefined grid
        let altMarginalRatesGrid = [
            0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9,
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            15, 20, 25, 30, 35, 40, 45, 50,
            60, 70, 80, 90, 99, 99.9
        ];
        let altTaxRevenue = new Array(altMarginalRatesGrid.length);
        altTaxRevenue.fill(0);

        // Adjustments coefficients used to match alternative average tax rates
        // (proportional to mtr*(1 - mtr)
        let altAvgMarginalRatesCoefs = marginalRates.map((mtr) => 1 - mtr);
        let altAvgMarginalRatesCoefsMean = 0;
        let k = 0;
        for (let i = 0; i < n; i++) {
            while (k + 1 < thresholds.length && this.wealthData['wealth'][i] >= thresholds[k + 1]) {
                k++;
            }
            if (this.wealthData['wealth'][i] >= thresholds[k]) {
                altAvgMarginalRatesCoefsMean +=
                    altAvgMarginalRatesCoefs[k]*this.wealthData['weight'][i];
            }
        }
        altAvgMarginalRatesCoefsMean = altAvgMarginalRatesCoefsMean/
            (this.totalPopShortRun*this.wealthData['population']);
        altAvgMarginalRatesCoefs = altAvgMarginalRatesCoefs.map(
            (coef) => coef/altAvgMarginalRatesCoefsMean
        );

        // Tax revenue under different assumptions
        for (let j = 0; j < altMarginalRatesGrid.length; j++) {
            let altMarginalRates = marginalRates.map((mtr, k) =>
                mtr + altAvgMarginalRatesCoefs[k]*(altMarginalRatesGrid[j]/100 - this.avgMarginalRate)
            )

            let altDeclaredWealth = this.estimateDeclaredWealth(thresholds, altMarginalRates);
            let altExtraConsumption = this.estimateExtraConsumption(thresholds, altMarginalRates);
            let altTaxPaid = this.estimateTaxPaid(thresholds, altMarginalRates, altDeclaredWealth);
            let altLongRunWeights = this.estimateLongRunWeights(altTaxPaid, altExtraConsumption);

            altTaxRevenue[j] = altTaxPaid
                .map((y, i) => y*altLongRunWeights[i])
                .reduce((x, y) => x + y, 0);
            altTaxRevenue[j] = altTaxRevenue[j] >= 0 ? altTaxRevenue[j] : 0;
            altTaxRevenue[j] = altTaxRevenue[j]/this.wealthData['nationalIncome'];
        }

        let lafferCurve = altMarginalRatesGrid.map((mtr, j) => {
            return({'x': mtr, 'y': 100*altTaxRevenue[j]});
        });
        lafferCurve.unshift({'x': 0, 'y': 0});

        return lafferCurve;
    }

    makeLafferChart(thresholds, marginalRates) {
        let lafferCurve = this.estimateLafferCurve(thresholds, marginalRates);

        this.lafferChartData = {
            datasets: [{
                label: 'Current point',
                data: [{'x': 100*this.avgMarginalRate, 'y': 100*this.totalTaxRevenueLongRun}],
                pointRadius: 5,
                backgroundColor: '#e76f51',
            }, {
                label: 'Laffer curve',
                data: lafferCurve,
                showLine: true,
                pointRadius: 0
            }],
        };

        this.lafferChartOptions = {
            responsive: true,
            aspectRatio: 1.3,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let line1 = "Average marginal tax rate: "
                                + context.parsed.x.toPrecision(2)
                                + "%";
                            let line2 = "Long-run tax revenue: "
                                + context.parsed.y.toPrecision(2)
                                + "% of national income";
                            return [line1, line2];
                        }
                    }
                },
            },
            elements: {
                line: {
                    borderColor: '#005f73ff',
                    tension: 0.4,
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "average marginal tax rate (%)",
                        color: "white",
                        font: {
                            size: 12,
                        }
                    },
                    grid: {
                        color: '#94d2bdff',
                        borderColor: '#94d2bdff',
                        tickColor: '#94d2bdff',
                        borderWidth: 1,
                        lineWidth: 1,
                    },
                    ticks: {
                        color: "white",
                        font: {
                            size: 10,
                        }
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "tax revenue (% of national income)",
                        color: "white",
                        font: {
                            size: 12,
                        }
                    },
                    grid: {
                        color: '#94d2bdff',
                        borderColor: '#94d2bdff',
                        tickColor: '#94d2bdff',
                        borderWidth: 1,
                        lineWidth: 1,
                    },
                    ticks: {
                        color: "white",
                        font: {
                            size: 10,
                        }
                    },
                },
            },
        }
    }
    runSimulation() {
        let brackets = this.getSortedBrackets();
        this.sortedThresholds = brackets['thresholds'];
        this.sortedMarginalRates = brackets['marginalRates'];

        let thresholds = this.sortedThresholds.map((threshold) => 1e6*threshold);
        let marginalRates = this.sortedMarginalRates.map((rate) => rate/100);

        let declaredWealth = this.estimateDeclaredWealth(thresholds, marginalRates);
        let extraConsumption = this.estimateExtraConsumption(thresholds, marginalRates);

        let taxPaid = this.estimateTaxPaid(thresholds, marginalRates, declaredWealth);
        let longRunWeights = this.estimateLongRunWeights(taxPaid, extraConsumption);

        this.estimateTaxStatistics(thresholds, marginalRates, taxPaid, longRunWeights);
        this.estimateLongRunInequality(taxPaid, longRunWeights);

        this.makeInequalityChart();
        this.makeLafferChart(thresholds, marginalRates);
    }
    addBracketBelow(i) {
        let thresholds = this.state.thresholds.slice();
        let marginalRates = this.state.marginalRates.slice();

        if (i + 1 < thresholds.length) {
            thresholds.splice(i + 1, 0, null);
            marginalRates.splice(i + 1, 0, null);
        } else {
            thresholds.push(null);
            marginalRates.push(null);
        }

        this.setState({
            thresholds: thresholds,
            marginalRates: marginalRates
        });
    }
    addBracketAbove(i) {
        let thresholds = this.state.thresholds.slice();
        let marginalRates = this.state.marginalRates.slice();

        if (i > 1) {
            thresholds.splice(i, 0, null);
            marginalRates.splice(i, 0, null);
        } else {
            thresholds.unshift(null);
            marginalRates.unshift(null);
        }

        this.setState({
            thresholds: thresholds,
            marginalRates: marginalRates
        });
    }
    removeBracket(i) {
        let thresholds = this.state.thresholds.slice();
        let marginalRates = this.state.marginalRates.slice();

        thresholds.splice(i, 1);
        marginalRates.splice(i, 1);

        this.setState({
            thresholds: thresholds,
            marginalRates: marginalRates
        });
    }
    handleChangeThreshold(i, event) {
        let thresholds = this.state.thresholds;
        thresholds[i] = Number(event.target.value);
        if (thresholds[i] < 0) {
            thresholds[i] = 0;
        }
        this.setState({thresholds: thresholds});
    }
    handleChangeMarginalRate(i, event) {
        let marginalRates = this.state.marginalRates;
        marginalRates[i] = Number(event.target.value);
        if (marginalRates[i] < 0) {
            marginalRates[i] = 0;
        } else if (marginalRates[i] > 99) {
            marginalRates[i] = 99;
        }
        this.setState({marginalRates: marginalRates});
    }
    handleChangeTaxAvoidanceElasticity(event) {
        this.setState({
            taxAvoidanceElasticity: event.target.value
        });
    }
    handleChangeConsumptionElasticity(event) {
        this.setState({
            consumptionElasticity: event.target.value
        });
    }
    handleChangeMobilityAdjustment(event) {
        this.setState({
            mobilityAdjustment: event.target.value
        });
    }
    componentDidUpdate() {
        const toastElem = document.getElementById('completed-alert');
        const toast = new Toast(toastElem);
        toast.show();
    }
    render() {
        this.runSimulation()
        return(
            <div className="container">
                <div className="row mb-5 justify-content-center">
                    <div className="row">
                        <h2 className="text-shadow">Tax <span className="title-highlight-alt">Schedule</span></h2>
                    </div>
                    <div className="row justify-content-around">
                        <div className="col-lg-6">
                            <div className="card mt-3 pt-2 mb-3 shadow">
                                <div className="card-body">
                                    <h5>Define your own wealth tax schedule</h5>
                                    <p>Use this section to define your tax schedule: you can specify any number of brackets by indicating their lower thresholds (expressed in millions of dollars) and the corresponding marginal tax rate on wealth (in percent) to apply in each of them.</p>
                                    <p>Don’t worry about the order. The program automatically sorts the brackets from the lowest to the highest threshold. If you prefer, use “Sort brackets” to sort them explicitly.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="card mt-3 mb-3 shadow color-alt">
                                <div className="card-body">
                                    <div className="row ps-3 pe-3">
                                        <WealthTaxSchedule
                                            bracketId={this.state.bracketId}
                                            thresholds={this.state.thresholds}
                                            marginalRates={this.state.marginalRates}
                                            popImpacted={this.state.thresholds.map(
                                                (threshold, i) => this.estimatePopAbove(1e6*threshold)
                                            )}
                                            handleChangeThreshold={this.state.thresholds.map(
                                                (id, i) => ((event) => this.handleChangeThreshold(i, event))
                                            )}
                                            handleChangeMarginalRate={this.state.thresholds.map(
                                                (id, i) => ((event) => this.handleChangeMarginalRate(i, event))
                                            )}
                                            removeBracket={this.state.thresholds.map(
                                                (id, i) => (() => this.removeBracket(i))
                                            )}
                                        />
                                    </div>
                                    <div className="row justify-content-end mt-2 pe-1 gx-2 gy-2">
                                        <div className="col-auto">
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                onClick={() => this.addBracketAbove(this.state.thresholds.length)}
                                            >
                                                <i className="fa-solid fa-plus"></i>&nbsp; Add bracket
                                            </button>
                                        </div>
                                        <div className="col-auto">
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                onClick={() => this.sortBrackets()}
                                            >
                                                <i className="fa-solid fa-arrow-down-1-9"></i>&nbsp; Sort brackets
                                            </button>
                                        </div>
                                        <div className="col-auto">
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => this.resetBrackets()}
                                            >
                                                <i className="fa-solid fa-arrow-rotate-left"></i>&nbsp; Reset
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row mb-5 justify-content-center">
                    <div className="row">
                        <h2 className="text-shadow"><span className="title-highlight-alt">Behavioral</span> Parameters</h2>
                    </div>
                    <div className="row justify-content-around">
                        <div className="col-lg-6">
                            <div className="card mt-3 pt-2 mb-3 shadow">
                                <div className="card-body">
                                    <h5>Adjust How People React to the Tax</h5>
                                    <p>Taxation changes how much wealth is available to be taxed. When people have to pay a wealth tax, they end up with less disposable income, so they have less money available for savings. They may also decide to consume more rather than save and pay the tax on the wealth they accumulate. Finally, they may also decide to hide some of their wealth by engaging in tax evasion or tax avoidance.</p>
                                    <p>This simulator accounts for these effects based on three parameters. You can keep the default settings, with have been chosen to align with the available evidence on reactions to wealth taxes. Or you can choose different values.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="card mt-3 mb-3 shadow behavioral-parameters color-alt">
                                <div className="card-body">
                                    <div className="row">
                                        <label
                                            htmlFor="tax-avoidance-range"
                                            className="form-label ps-3 pe-3"
                                        >
                                            <div className="container">
                                                <div className="row justify-content-start">
                                                    <div className="col-auto py-1 px-0 me-2">Elasticity of tax avoidance</div>
                                                    <div className="col-auto parameter py-1 px-2">&epsilon;&nbsp;=&nbsp;{this.state.taxAvoidanceElasticity}</div>
                                                </div>
                                            </div>
                                        </label>
                                        <input
                                            type="range"
                                            className="form-range ps-3 pe-3"
                                            value={this.state.taxAvoidanceElasticity}
                                            min="0"
                                            max="8"
                                            step="0.1"
                                            id="tax-avoidance-range"
                                            onChange={this.handleChangeTaxAvoidanceElasticity}
                                        />
                                        <p className="ps-3 pe-3 mt-2 mb-0 muted small">The elasticity of tax avoidance (&epsilon;) defines how people react to the wealth tax by hiding their wealth. An elasticity &epsilon; means that, in response to a marginal tax rate &tau;, people only report a fraction (1&nbsp;&mdash;&nbsp;&tau;)<sup>&epsilon;</sup> of their wealth to the tax authorities. So for a small rate &tau;&nbsp;=&nbsp;1%, people hide roughly &epsilon;% of their wealth. When &epsilon;% is high, the wealth tax raises less revenue.</p>
                                    </div>
                                    <hr/>
                                    <div className="row">
                                        <label
                                            htmlFor="consumption-range"
                                            className="form-label ps-3 pe-3"
                                        >
                                            <div className="container">
                                                <div className="row justify-content-start">
                                                    <div className="col-auto py-1 px-0 me-2">Elasticity of consumption</div>
                                                    <div className="col-auto parameter py-1 px-2">&eta;&nbsp;=&nbsp;{this.state.consumptionElasticity}</div>
                                                </div>
                                            </div>
                                        </label>
                                        <input
                                            type="range"
                                            className="form-range ps-3 pe-3"
                                            value={this.state.consumptionElasticity}
                                            min="0"
                                            max="8"
                                            step="0.1"
                                            id="consumption-range"
                                            onChange={this.handleChangeConsumptionElasticity}
                                        />
                                        <p className="ps-3 pe-3 mt-2 mb-0 muted small">The elasticity of consumption (&eta;) defines how much people react to the wealth tax by increasing their consumption. An elasticity of &eta; means that, in response to a marginal tax rate &tau;, people increase their consumption by a factor (1&nbsp;&mdash;&nbsp;&tau;)<sup>&mdash;&eta;</sup>. So for a small rate &tau;&nbsp;=&nbsp;1%, people increase their consumption by roughly &eta;%. When &eta; is high, people accumulate less wealth, so the tax raises less revenue in the long run.</p>
                                    </div>
                                    <hr/>
                                    <div className="row">
                                        <label
                                            htmlFor="mobility-range"
                                            className="form-label ps-3 pe-3"
                                        >
                                            <div className="container">
                                                <div className="row justify-content-start">
                                                    <div className="col-auto py-1 px-0 me-2">Mobility in the wealth distribution (multiplier)</div>
                                                    <div className="col-auto parameter py-1 px-2">&beta;&nbsp;=&nbsp;{this.state.mobilityAdjustment}</div>
                                                </div>
                                            </div>
                                        </label>
                                        <input
                                            type="range"
                                            className="form-range ps-3 pe-3"
                                            value={this.state.mobilityAdjustment}
                                            min="0.1"
                                            max="3"
                                            step="0.1"
                                            id="mobility-range"
                                            onChange={this.handleChangeMobilityAdjustment}
                                        />
                                        <p className="ps-3 pe-3 mt-2 mb-0 muted small">Mobility in the wealth distribution changes the effects of the wealth tax. When mobility is very high, people only spend a short time in a given wealth bracket. And new people with their previously untaxed wealth keep entering the tax schedule. Therefore, the wealth tax has a limited effect on the distribution. But if mobility is low, the wealth tax repeatedly taxes the same wealth: in the long run, little wealth is left to tax. By default, the model is calibrated to match the wealth mobility observed in the United States. But you can adjust it by a factor &beta;. When &beta; is high, the wealth tax can raise more revenue.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row justify-content-center">
                    <div className="row">
                        <h2 className="text-shadow">See the <span className="title-highlight-alt">Results</span></h2>
                    </div>
                    <div className="row justify-content-around mb-5">
                        <div className="col-lg-6">
                            <div className="card mt-3 pt-2 mb-3 shadow">
                                <div className="card-body">
                                    <h5>How much money does your tax raise?</h5>
                                    <p>This table describes how much money you get from each wealth tax bracket if your tax were enacted in the United States. It includes two variants: the “short-run” estimate only accounts for tax avoidance and indicates how much revenue you would get during the first few years. But over time, people progressively accumulate less wealth due to the tax. Decades later, the wealth available to be taxed will be lower. The “long-run” estimate shows how much money you will still be able to raise despite these effects.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="card mt-3 mb-3 shadow color-alt">
                                <div className="card-body">
                                    <div className="row ps-3 pe-3">
                                        <WealthTaxRevenue
                                            thresholds={this.sortedThresholds}
                                            marginalRates={this.sortedMarginalRates}
                                            popShortRun={this.popShortRun}
                                            taxRevenueShortRun={this.taxRevenueShortRun}
                                            popLongRun={this.popLongRun}
                                            taxRevenueLongRun={this.taxRevenueLongRun}
                                            totalPopShortRun={this.totalPopShortRun}
                                            totalTaxRevenueShortRun={this.totalTaxRevenueShortRun}
                                            totalPopLongRun={this.totalPopLongRun}
                                            totalTaxRevenueLongRun={this.totalTaxRevenueLongRun}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-around mb-5">
                        <div className="col-lg-6">
                            <div className="card mt-3 pt-2 mb-3 shadow">
                                <div className="card-body">
                                    <h5>How does it affect wealth inequality?</h5>
                                    <p>Progressive wealth taxation lowers wealth inequality in the long run because it limits the wealthiest people’s ability to accumulate money.</p>
                                    <p>This chart estimates how large these effects are. For each top wealth group, it shows their current share of wealth and the share of the wealth they would eventually have if the wealth tax were put in place.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="card mt-3 mb-3 shadow color-alt">
                                <div className="card-body">
                                    <div className="row ps-3 pe-3">
                                        <div>
                                            <Bar data={this.inequalityChartData} options={this.inequalityChartOptions}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-around">
                        <div className="col-lg-6">
                            <div className="card mt-3 pt-2 mb-3 shadow">
                                <div className="card-body">
                                    <h5>Can you raise more revenue?</h5>
                                    <p>You face a trade-off when trying to raise as much revenue as possible from a wealth tax. On the one hand, raising the tax rates lets you extract more money from the tax base. On the other hand, higher rates shrink the tax base itself as it makes people accumulate less money. Consider the two extremes: with a 0% tax rate, you raise no revenue. But with a 100% tax rate, you’re unlikely to raise any money either because no one will accumulate wealth if it means having to pay a 100% tax rate. The rate that maximizes tax revenue is somewhere in between.</p>
                                    <p>This chart looks at variants of the tax schedule you provided. Each variant alters your tax rates so that they go from 0% to 100% on average. For each variant, it calculates the long-run tax revenue. It then plots the results as a line that relates the average marginal tax rate to the tax revenue.</p>
                                    <p>The result is an inverted U-shaped curve, sometimes called the “Laffer curve.” The point indicates where you currently stand on that curve. If you find yourself in the upward-slopping part, you can raise more revenue by increasing the wealth tax rates. But if you are in the downward sloping part, you can actually raise more money by lowering the rates.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="card mt-3 mb-3 shadow color-alt">
                                <div className="card-body">
                                    <div className="row ps-3 pe-3">
                                        <Scatter data={this.lafferChartData} options={this.lafferChartOptions}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
