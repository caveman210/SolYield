import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { PDF_COLORS } from '../design/staticColors';
import { PerformanceStats, ChartDataPoint } from '../hooks/usePerformanceData';
import { Site } from '../types';

/**
 * Professional PDF Generator
 * Fetches specific database metadata for a "prolific" report structure.
 */
export const generatePerformancePDF = async (
  site: Site | null,
  periodLabel: string,
  stats: PerformanceStats,
  dailyLogs: ChartDataPoint[]
): Promise<{ uri: string; shared: boolean }> => {
  // Ensure we use the actual database values for Name and Capacity 
  const assetName = site ? site.name : 'Portfolio Aggregate';
  const assetCapacity = site ? site.capacity : 'Total Managed Capacity';
  const assetCoordinates = site 
    ? `${site.location.lat.toFixed(6)}°, ${site.location.lng.toFixed(6)}°` 
    : 'Multiple Locations';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 15mm; }
          body { font-family: 'Helvetica', sans-serif; color: #333; line-height: 1.5; }
          .header { border-bottom: 3px solid ${PDF_COLORS.header.background}; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .title-section h1 { color: ${PDF_COLORS.header.background}; margin: 0; font-size: 24px; }
          .meta-section { text-align: right; font-size: 12px; color: #666; }
          
          .section-title { background: #f0f0f0; padding: 8px; font-weight: bold; text-transform: uppercase; font-size: 12px; margin-top: 20px; }
          
          .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; }
          .profile-item label { font-size: 10px; color: #999; text-transform: uppercase; display: block; }
          .profile-item span { font-weight: bold; font-size: 14px; }

          .stats-grid { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee; }
          .stat-box { text-align: center; flex: 1; }
          .stat-box label { font-size: 10px; color: #666; display: block; }
          .stat-box .value { font-size: 18px; font-weight: bold; color: ${PDF_COLORS.chart.primary}; }

          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f8f8f8; text-align: left; padding: 10px; font-size: 10px; border-bottom: 2px solid #eee; }
          td { padding: 10px; font-size: 11px; border-bottom: 1px solid #eee; }
          .high-perf { color: ${PDF_COLORS.overPerforming.text}; font-weight: bold; }
          
          .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 9px; color: #ccc; border-top: 1px solid #eee; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-section">
            <h1>SolYield Performance Audit</h1>
            <p>Asset Intelligence Report</p>
          </div>
          <div class="meta-section">
            <p>Report ID: SY-${Date.now().toString().slice(-6)}</p>
            <p>Period: ${periodLabel}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div class="section-title">Asset Identification</div>
        <div class="profile-grid">
          <div class="profile-item"><label>Asset Name</label><span>${assetName}</span></div>
          <div class="profile-item"><label>Coordinates</label><span>${assetCoordinates}</span></div>
          <div class="profile-item"><label>Operating Capacity</label><span>${assetCapacity}</span></div>
          <div class="profile-item"><label>Status</label><span>Active / Online</span></div>
        </div>

        <div class="section-title">Key Performance Indicators</div>
        <div class="stats-grid">
          <div class="stat-box"><label>Total Energy</label><div class="value">${stats.totalEnergy.toFixed(2)} kWh</div></div>
          <div class="stat-box"><label>Peak Generation</label><div class="value">${stats.peakPower.toFixed(2)} kWh</div></div>
          <div class="stat-box"><label>Avg Efficiency</label><div class="value">${stats.efficiency.toFixed(1)}%</div></div>
        </div>

        <div class="section-title">Historical Yield Logs</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Energy (kWh)</th>
              <th>Variance (%)</th>
              <th>System Status</th>
            </tr>
          </thead>
          <tbody>
            ${dailyLogs.map(log => {
              const variance = ((log.value / stats.avgGeneration) * 100 - 100).toFixed(1);
              return `
                <tr>
                  <td>${log.date}</td>
                  <td class="${log.value >= stats.avgGeneration ? 'high-perf' : ''}">${log.value.toFixed(2)}</td>
                  <td>${variance}%</td>
                  <td>${log.value > 0 ? 'NOMINAL' : 'OFFLINE'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          SolYield Mobile Application | ClimaI Cleantech Pvt Ltd | System-Generated Audit
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  let shared = false;
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
    shared = true;
  }
  return { uri, shared };
};
