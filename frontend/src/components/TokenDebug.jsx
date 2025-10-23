import React from 'react'
import { tokenManager } from '../utils/tokenManager'

const TokenDebug = () => {
  const handleClearTokens = () => {
    tokenManager.clearTokens()
    alert('Tokens cleared! Please refresh the page.')
  }

  const tokensInfo = tokenManager.getTokensInfo()

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h3>Token Debug Information</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h5>Token Status</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>Has Access Token:</strong> {tokensInfo.hasAccess ? '✅ Yes' : '❌ No'}
                </li>
                <li className="list-group-item">
                  <strong>Has Refresh Token:</strong> {tokensInfo.hasRefresh ? '✅ Yes' : '❌ No'}
                </li>
                <li className="list-group-item">
                  <strong>Access Token Expired:</strong> 
                  {tokensInfo.accessExpired === null ? ' N/A' : 
                   tokensInfo.accessExpired ? ' ❌ Expired' : ' ✅ Valid'}
                </li>
                <li className="list-group-item">
                  <strong>Refresh Token Expired:</strong> 
                  {tokensInfo.refreshExpired === null ? ' N/A' : 
                   tokensInfo.refreshExpired ? ' ❌ Expired' : ' ✅ Valid'}
                </li>
              </ul>
            </div>
            <div className="col-md-6">
              <h5>Expiration Times</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>Access Expires:</strong><br/>
                  {tokensInfo.accessExpiration ? 
                    tokensInfo.accessExpiration.toLocaleString() : 'N/A'}
                </li>
                <li className="list-group-item">
                  <strong>Refresh Expires:</strong><br/>
                  {tokensInfo.refreshExpiration ? 
                    tokensInfo.refreshExpiration.toLocaleString() : 'N/A'}
                </li>
              </ul>
            </div>
          </div>
          
          <div className="row mt-4">
            <div className="col-12">
              <h5>Raw Token Values</h5>
              <div className="mb-2">
                <label className="form-label"><strong>Access Token:</strong></label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  readOnly 
                  value={localStorage.getItem('access_token') || 'Not found'}
                />
              </div>
              <div className="mb-2">
                <label className="form-label"><strong>Refresh Token:</strong></label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  readOnly 
                  value={localStorage.getItem('refresh_token') || 'Not found'}
                />
              </div>
            </div>
          </div>
          
          <div className="row mt-4">
            <div className="col-12">
              <button 
                className="btn btn-danger me-2" 
                onClick={handleClearTokens}
              >
                Clear All Tokens
              </button>
              <button 
                className="btn btn-info" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenDebug