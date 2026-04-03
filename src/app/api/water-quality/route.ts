import { NextRequest, NextResponse } from "next/server";
import {
  fetchSamplingPointsNear,
  fetchPfasReadings,
  type SamplingPoint,
  type PfasReading,
} from "@/lib/ea-api";
import { apiLimiter, isMemoryRateLimited } from "@/lib/rate-limit";

interface WaterQualityResponse {
  samplingPoints: SamplingPoint[];
  pfasReadings: PfasReading[];
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<WaterQualityResponse | ErrorResponse>> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const limited = apiLimiter
    ? !(await apiLimiter.limit(ip)).success
    : isMemoryRateLimited(ip, 10, 60_000);

  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = request.nextUrl;

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const radiusParam = searchParams.get("radius");

  // Validate required params
  if (latParam === null || lngParam === null) {
    return NextResponse.json(
      { error: "Missing required query parameters: lat and lng" },
      { status: 400 }
    );
  }

  const lat = parseFloat(latParam);
  const lng = parseFloat(lngParam);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: "lat and lng must be valid numbers",
      },
      { status: 400 }
    );
  }

  if (lat < -90 || lat > 90) {
    return NextResponse.json(
      {
        error: "Invalid lat value",
        details: "lat must be between -90 and 90",
      },
      { status: 400 }
    );
  }

  if (lng < -180 || lng > 180) {
    return NextResponse.json(
      {
        error: "Invalid lng value",
        details: "lng must be between -180 and 180",
      },
      { status: 400 }
    );
  }

  // Optional radius with sensible bounds
  let radiusKm = 10;
  if (radiusParam !== null) {
    const parsedRadius = parseFloat(radiusParam);
    if (isNaN(parsedRadius) || parsedRadius <= 0) {
      return NextResponse.json(
        {
          error: "Invalid radius value",
          details: "radius must be a positive number (km)",
        },
        { status: 400 }
      );
    }
    radiusKm = Math.min(parsedRadius, 50); // cap at 50 km to avoid huge responses
  }

  try {
    const [samplingPoints, pfasReadings] = await Promise.all([
      fetchSamplingPointsNear(lat, lng, radiusKm),
      fetchPfasReadings(lat, lng, radiusKm),
    ]);

    return NextResponse.json({ samplingPoints, pfasReadings });
  } catch (err) {
    console.error("[api/water-quality] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
