const LIST_CATEGORIES_LISTENING = [
  'Daily Conversations - A1',
  'Daily Conversations - A2',
  'Daily Conversations - B1',
  'Daily Conversations - B2',
  'Daily Conversations - C1',
  'Daily Conversations - C2',
  'Business English - A1',
  'Business English - A2',
  'Business English - B1',
  'Business English - B2',
  'Business English - C1',
  'Business English - C2',
  'Travel Scenarios - A1',
  'Travel Scenarios - A2',
  'Travel Scenarios - B1',
  'Travel Scenarios - B2',
  'Travel Scenarios - C1',
  'Travel Scenarios - C2',
]

export async function GET() {
  return Response.json(LIST_CATEGORIES_LISTENING)
}
