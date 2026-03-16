import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getZoneSummaries, getAnomalies } from '@/lib/mockData';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { zone } = await req.json();

  if (!zone) {
    return NextResponse.json({ error: 'Zone is required' }, { status: 400 });
  }

  const summaries = getZoneSummaries();
  const zoneSummary = summaries.find(z => z.zone === zone);

  if (!zoneSummary) {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
  }

  if (zoneSummary.listingCount < 20) {
    return NextResponse.json({
      summary: 'Insufficient data for this district. A minimum of 20 active listings is required to generate a market summary.',
      zone,
      generatedAt: new Date().toISOString(),
      insufficient: true,
    });
  }

  const anomalies = getAnomalies(zone);
  const trendDirection = zoneSummary.mom > 1 ? 'rising' : zoneSummary.mom < -1 ? 'declining' : 'stable';

  const districtData = {
    zone,
    avgPricePerSqm: zoneSummary.avgPricePerSqm,
    medianPricePerSqm: zoneSummary.medianPricePerSqm,
    minPricePerSqm: zoneSummary.minPricePerSqm,
    maxPricePerSqm: zoneSummary.maxPricePerSqm,
    activeListings: zoneSummary.listingCount,
    monthOverMonthChange: `${zoneSummary.mom > 0 ? '+' : ''}${zoneSummary.mom}%`,
    yearOverYearChange: `${zoneSummary.yoy > 0 ? '+' : ''}${zoneSummary.yoy}%`,
    trendDirection,
    anomalyCount: zoneSummary.anomalyCount,
    underpricedListings: zoneSummary.underpricedCount,
    overpricedListings: zoneSummary.overpricedCount,
    dataAsOf: '16 Mar 2026',
  };

  const systemPrompt = `You are a Bangkok property market analyst. Your role is to provide concise, factual market summaries based strictly on the data provided.

Rules:
- Always reference specific numbers from the data
- Never speculate about future prices or make investment recommendations
- Keep summaries to 3-5 sentences maximum
- Use plain English, no bullet points, no markdown formatting
- Tone: neutral and factual, like a Bloomberg terminal analyst
- Disclose that this is an AI-generated summary`;

  const userPrompt = `Generate a market summary for the ${zone} district based on this data:

${JSON.stringify(districtData, null, 2)}

The summary should cover: current price level, trend direction, price range spread, and any notable anomalies. End with a disclosure that this is an AI-generated summary.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const summary = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      summary,
      zone,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
      insufficient: false,
    });
  } catch (err) {
    console.error('Claude API error:', err);
    return NextResponse.json({
      summary: 'Summary unavailable — data error. Please try again later.',
      zone,
      generatedAt: new Date().toISOString(),
      error: true,
    });
  }
}
