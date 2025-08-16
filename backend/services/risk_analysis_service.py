"""
Risk Analysis Service for DeFiGuard
Implements sophisticated portfolio risk analysis using Riskfolio-Lib and PyPortfolioOpt
"""

import pandas as pd
import numpy as np
import yfinance as yf
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Portfolio Optimization Libraries
import riskfolio as rp
from pypfopt import EfficientFrontier, risk_models, expected_returns
from pypfopt.plotting import plot_covariance, plot_efficient_frontier
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from io import BytesIO
import base64

from loguru import logger


class RiskAnalysisService:
    """Advanced portfolio risk analysis using modern portfolio theory"""
    
    def __init__(self):
        self.crypto_symbol_mapping = {
            'ETH': 'ETH-USD',
            'BTC': 'BTC-USD', 
            'USDC': 'USDC-USD',
            'USDT': 'USDT-USD',
            'MATIC': 'MATIC-USD',
            'AVAX': 'AVAX-USD',
            'SOL': 'SOL-USD',
            'DOT': 'DOT-USD',
            'LINK': 'LINK-USD',
            'UNI': 'UNI-USD',
            'AAVE': 'AAVE-USD',
            'COMP': 'COMP-USD',
            'MKR': 'MKR-USD',
            'YFI': 'YFI-USD',
            'SUSHI': 'SUSHI-USD'
        }
        
    async def get_portfolio_risk_analysis(
        self,
        portfolio_data: Dict[str, float], 
        lookback_days: int = 365
    ) -> Dict[str, Any]:
        """
        Complete risk analysis for a portfolio
        
        Args:
            portfolio_data: Dict mapping symbols to values in USD
            lookback_days: Historical data lookback period
            
        Returns:
            Dict containing all risk analysis results
        """
        try:
            # Get historical price data
            prices_df = await self._fetch_historical_prices(
                list(portfolio_data.keys()), 
                lookback_days
            )
            
            if prices_df is None or prices_df.empty:
                logger.error("Could not fetch price data for risk analysis")
                return {"error": "Unable to fetch price data"}
            
            # Calculate portfolio weights
            total_value = sum(portfolio_data.values())
            weights = {symbol: value / total_value for symbol, value in portfolio_data.items()}
            
            # Run all analyses
            results = {}
            
            # 1. Risk Contribution Analysis (Riskfolio-Lib)
            risk_contrib = await self._calculate_risk_contribution(prices_df, weights)
            results['risk_contribution'] = risk_contrib
            
            # 2. Asset Correlation Heatmap
            correlation_data = await self._calculate_correlation_matrix(prices_df)
            results['correlation'] = correlation_data
            
            # 3. Efficient Frontier Analysis (PyPortfolioOpt)
            efficient_frontier = await self._calculate_efficient_frontier(prices_df, weights)
            results['efficient_frontier'] = efficient_frontier
            
            # 4. Portfolio Metrics Summary
            portfolio_metrics = await self._calculate_portfolio_metrics(prices_df, weights)
            results['portfolio_metrics'] = portfolio_metrics
            
            logger.info(f"✅ Risk analysis completed for {len(portfolio_data)} assets")
            return results
            
        except Exception as e:
            logger.error(f"❌ Risk analysis failed: {e}")
            return {"error": str(e)}
    
    async def _fetch_historical_prices(
        self, 
        symbols: List[str], 
        lookback_days: int
    ) -> Optional[pd.DataFrame]:
        """Fetch historical price data for crypto assets"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=lookback_days)
            
            # Map crypto symbols to Yahoo Finance tickers
            yf_symbols = []
            symbol_mapping = {}
            
            for symbol in symbols:
                if symbol in self.crypto_symbol_mapping:
                    yf_symbol = self.crypto_symbol_mapping[symbol]
                    yf_symbols.append(yf_symbol)
                    symbol_mapping[yf_symbol] = symbol
            
            if not yf_symbols:
                logger.error("No valid symbols found for price fetching")
                return None
            
            # Download price data
            logger.info(f"📈 Fetching {lookback_days} days of price data for: {yf_symbols}")
            data = yf.download(yf_symbols, start=start_date, end=end_date, group_by='ticker')
            
            if data.empty:
                return None
                
            # Extract closing prices and rename columns
            prices = pd.DataFrame()
            
            if len(yf_symbols) == 1:
                # Single asset case
                symbol = yf_symbols[0]
                if 'Close' in data.columns:
                    prices[symbol_mapping[symbol]] = data['Close']
            else:
                # Multiple assets case
                for yf_symbol in yf_symbols:
                    if (yf_symbol, 'Close') in data.columns:
                        prices[symbol_mapping[yf_symbol]] = data[yf_symbol]['Close']
            
            # Remove any assets with insufficient data
            prices = prices.dropna(axis=1, thresh=len(prices) * 0.8)
            prices = prices.dropna()
            
            logger.info(f"📊 Retrieved price data: {prices.shape[0]} days, {prices.shape[1]} assets")
            return prices
            
        except Exception as e:
            logger.error(f"❌ Price fetch failed: {e}")
            return None
    
    async def _calculate_risk_contribution(
        self, 
        prices_df: pd.DataFrame, 
        weights: Dict[str, float]
    ) -> Dict[str, Any]:
        """Calculate risk contribution using Riskfolio-Lib"""
        try:
            # Calculate returns
            returns = prices_df.pct_change().dropna()
            
            # Filter weights to match available price data
            available_symbols = list(returns.columns)
            filtered_weights = {k: v for k, v in weights.items() if k in available_symbols}
            
            # Normalize weights
            total_weight = sum(filtered_weights.values())
            if total_weight > 0:
                filtered_weights = {k: v / total_weight for k, v in filtered_weights.items()}
            
            # Create portfolio object
            port = rp.Portfolio(returns=returns)
            
            # Calculate the risk model
            port.assets_stats(method_mu='hist', method_cov='hist')
            
            # Convert weights to Series
            w = pd.Series(index=returns.columns, dtype=float)
            for symbol in returns.columns:
                w[symbol] = filtered_weights.get(symbol, 0.0)
            
            # Calculate risk contributions
            risk_contrib = rp.RiskFunctions.Risk_Contribution(w, port.cov, None, None)
            
            # Convert to percentage and prepare for frontend
            risk_contrib_pct = (risk_contrib * 100).round(2)
            
            risk_data = []
            for symbol, contribution in risk_contrib_pct.items():
                risk_data.append({
                    'asset': symbol,
                    'risk_contribution': float(contribution),
                    'portfolio_weight': float(filtered_weights.get(symbol, 0) * 100)
                })
            
            logger.info(f"✅ Risk contribution calculated for {len(risk_data)} assets")
            
            return {
                'data': risk_data,
                'total_portfolio_risk': float(np.sqrt(w.T @ port.cov @ w) * 100),
                'analysis_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Risk contribution calculation failed: {e}")
            return {'error': str(e)}
    
    async def _calculate_correlation_matrix(
        self, 
        prices_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """Calculate asset correlation matrix"""
        try:
            # Calculate returns and correlation matrix
            returns = prices_df.pct_change().dropna()
            corr_matrix = returns.corr()
            
            # Convert to format suitable for heatmap
            correlation_data = []
            assets = list(corr_matrix.columns)
            
            for i, asset1 in enumerate(assets):
                for j, asset2 in enumerate(assets):
                    correlation_data.append({
                        'asset1': asset1,
                        'asset2': asset2,
                        'correlation': float(corr_matrix.iloc[i, j])
                    })
            
            # Summary statistics
            off_diagonal = corr_matrix.values[np.triu_indices_from(corr_matrix.values, k=1)]
            avg_correlation = float(np.mean(off_diagonal))
            max_correlation = float(np.max(off_diagonal))
            min_correlation = float(np.min(off_diagonal))
            
            logger.info(f"✅ Correlation matrix calculated for {len(assets)} assets")
            
            return {
                'data': correlation_data,
                'assets': assets,
                'summary': {
                    'average_correlation': avg_correlation,
                    'max_correlation': max_correlation,
                    'min_correlation': min_correlation,
                    'diversification_ratio': 1 - avg_correlation  # Simple diversification measure
                },
                'analysis_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Correlation calculation failed: {e}")
            return {'error': str(e)}
    
    async def _calculate_efficient_frontier(
        self, 
        prices_df: pd.DataFrame, 
        weights: Dict[str, float]
    ) -> Dict[str, Any]:
        """Calculate efficient frontier using PyPortfolioOpt"""
        try:
            # Calculate returns
            returns = prices_df.pct_change().dropna()
            
            # Calculate expected returns and covariance
            mu = expected_returns.mean_historical_return(prices_df)
            S = risk_models.sample_cov(prices_df)
            
            # Create efficient frontier
            ef = EfficientFrontier(mu, S)
            
            # Generate efficient frontier points
            frontier_points = []
            min_vol_ret, min_vol_risk = ef.portfolio_performance()
            ef = EfficientFrontier(mu, S)  # Reset
            
            # Calculate max return portfolio
            ef.max_sharpe()
            max_sharpe_ret, max_sharpe_risk, max_sharpe_ratio = ef.portfolio_performance()
            ef = EfficientFrontier(mu, S)  # Reset
            
            # Generate points along the frontier
            target_returns = np.linspace(min_vol_ret, mu.max(), 20)
            
            for target_return in target_returns:
                try:
                    ef_temp = EfficientFrontier(mu, S)
                    ef_temp.efficient_return(target_return)
                    ret, vol, _ = ef_temp.portfolio_performance()
                    frontier_points.append({
                        'return': float(ret * 100),  # Convert to percentage
                        'risk': float(vol * 100),
                        'sharpe_ratio': float(ret / vol) if vol > 0 else 0
                    })
                except:
                    continue
            
            # Calculate current portfolio performance
            available_symbols = list(returns.columns)
            filtered_weights = {k: v for k, v in weights.items() if k in available_symbols}
            total_weight = sum(filtered_weights.values())
            if total_weight > 0:
                filtered_weights = {k: v / total_weight for k, v in filtered_weights.items()}
            
            # Convert to pandas Series for calculation
            w = pd.Series(index=mu.index, dtype=float)
            for symbol in mu.index:
                w[symbol] = filtered_weights.get(symbol, 0.0)
            
            # Current portfolio metrics
            current_return = float((w * mu).sum() * 100)
            current_risk = float(np.sqrt(w.T @ S @ w) * 100)
            current_sharpe = current_return / current_risk if current_risk > 0 else 0
            
            logger.info(f"✅ Efficient frontier calculated with {len(frontier_points)} points")
            
            return {
                'frontier_points': frontier_points,
                'current_portfolio': {
                    'return': current_return,
                    'risk': current_risk,
                    'sharpe_ratio': float(current_sharpe)
                },
                'optimal_portfolios': {
                    'max_sharpe': {
                        'return': float(max_sharpe_ret * 100),
                        'risk': float(max_sharpe_risk * 100),
                        'sharpe_ratio': float(max_sharpe_ratio)
                    },
                    'min_volatility': {
                        'return': float(min_vol_ret * 100),
                        'risk': float(min_vol_risk * 100),
                        'sharpe_ratio': float(min_vol_ret / min_vol_risk)
                    }
                },
                'analysis_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Efficient frontier calculation failed: {e}")
            return {'error': str(e)}
    
    async def _calculate_portfolio_metrics(
        self, 
        prices_df: pd.DataFrame, 
        weights: Dict[str, float]
    ) -> Dict[str, Any]:
        """Calculate comprehensive portfolio risk metrics"""
        try:
            returns = prices_df.pct_change().dropna()
            
            # Filter weights to available data
            available_symbols = list(returns.columns)
            filtered_weights = {k: v for k, v in weights.items() if k in available_symbols}
            total_weight = sum(filtered_weights.values())
            if total_weight > 0:
                filtered_weights = {k: v / total_weight for k, v in filtered_weights.items()}
            
            # Calculate portfolio returns
            portfolio_returns = returns @ pd.Series(filtered_weights)
            
            # Calculate metrics
            annual_return = float(portfolio_returns.mean() * 252 * 100)  # Annualized %
            annual_volatility = float(portfolio_returns.std() * np.sqrt(252) * 100)  # Annualized %
            sharpe_ratio = annual_return / annual_volatility if annual_volatility > 0 else 0
            
            # Value at Risk (VaR) - 95% confidence
            var_95 = float(np.percentile(portfolio_returns, 5) * 100)
            
            # Maximum Drawdown
            cumulative_returns = (1 + portfolio_returns).cumprod()
            running_max = cumulative_returns.expanding().max()
            drawdowns = (cumulative_returns - running_max) / running_max
            max_drawdown = float(drawdowns.min() * 100)
            
            # Calmar Ratio
            calmar_ratio = annual_return / abs(max_drawdown) if max_drawdown != 0 else 0
            
            # Sortino Ratio (using downside deviation)
            downside_returns = portfolio_returns[portfolio_returns < 0]
            downside_deviation = float(downside_returns.std() * np.sqrt(252) * 100)
            sortino_ratio = annual_return / downside_deviation if downside_deviation > 0 else 0
            
            logger.info("✅ Portfolio metrics calculated successfully")
            
            return {
                'annual_return': annual_return,
                'annual_volatility': annual_volatility,
                'sharpe_ratio': float(sharpe_ratio),
                'var_95': var_95,
                'max_drawdown': max_drawdown,
                'calmar_ratio': float(calmar_ratio),
                'sortino_ratio': float(sortino_ratio),
                'analysis_period_days': len(returns),
                'analysis_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Portfolio metrics calculation failed: {e}")
            return {'error': str(e)}


# Global service instance
risk_analysis_service = RiskAnalysisService()


async def get_risk_analysis_service() -> RiskAnalysisService:
    """Get risk analysis service instance"""
    return risk_analysis_service
