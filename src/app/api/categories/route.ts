const LIST_CATEGORIES = [
  'i wanna practice preposition grammar',
  'i wanna practice modal verb grammar',
  'i wanna practice phrasal verb grammar',
  'i wanna practice verb grammar',
  'i wanna practice vocabulary',
]

export async function GET() {
  return Response.json(LIST_CATEGORIES)
}
