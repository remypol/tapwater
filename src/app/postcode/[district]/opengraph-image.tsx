import { ImageResponse } from 'next/og';
import { getPostcodeData } from '@/lib/data';

export const runtime = 'edge';
export const alt = 'Water quality report';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function gradeLabel(grade: string): string {
  switch (grade) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'fair': return 'Fair';
    case 'poor': return 'Poor';
    case 'very-poor': return 'Very Poor';
    default: return 'No Data';
  }
}

export default async function Image({ params }: { params: Promise<{ district: string }> }) {
  const { district } = await params;
  const data = await getPostcodeData(district);

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0c0f17',
            color: '#ffffff',
            fontFamily: 'sans-serif',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', fontSize: 28, color: '#9ca3af' }}>tapwater.uk</div>
          <div style={{ display: 'flex', fontSize: 22, color: '#6b7280' }}>Postcode not found</div>
        </div>
      ),
      { ...size }
    );
  }

  const scoreColor =
    data.safetyScore >= 7 ? '#16a34a' : data.safetyScore >= 5 ? '#d97706' : '#dc2626';
  const hasData = data.scoreGrade !== 'insufficient-data';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0c0f17',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', fontSize: 24, color: '#9ca3af' }}>tapwater.uk</div>
          <div style={{ display: 'flex', fontSize: 16, color: '#6b7280' }}>Water Quality Report</div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 60,
          }}
        >
          {/* Left: Location info */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              {data.district}
            </div>
            <div style={{ display: 'flex', fontSize: 28, color: '#9ca3af', marginTop: 8 }}>
              {data.areaName}
            </div>
            <div style={{ display: 'flex', fontSize: 20, color: '#6b7280', marginTop: 4 }}>
              {data.city}, {data.region}
            </div>
            {data.pfasDetected && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 20,
                  backgroundColor: '#2e1a47',
                  borderRadius: 8,
                  padding: '6px 14px',
                  width: 'fit-content',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#a855f7',
                  }}
                />
                <div style={{ display: 'flex', fontSize: 14, color: '#a855f7' }}>
                  PFAS detected
                </div>
              </div>
            )}
          </div>

          {/* Right: Score */}
          {hasData ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 120,
                  fontWeight: 700,
                  color: scoreColor,
                  lineHeight: 1,
                }}
              >
                {data.safetyScore.toFixed(1)}
              </div>
              <div style={{ display: 'flex', fontSize: 28, color: '#6b7280', marginTop: 4 }}>
                /10
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 22,
                  color: scoreColor,
                  marginTop: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {gradeLabel(data.scoreGrade)}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', fontSize: 28, color: '#6b7280' }}>
                Insufficient Data
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #1e293b',
            paddingTop: 20,
          }}
        >
          <div style={{ display: 'flex', fontSize: 16, color: '#6b7280' }}>
            {hasData
              ? `${data.contaminantsTested} contaminants tested · ${data.contaminantsFlagged} flagged`
              : 'Limited monitoring data available'}
          </div>
          <div style={{ display: 'flex', fontSize: 16, color: '#9ca3af' }}>
            Check yours → tapwater.uk
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
