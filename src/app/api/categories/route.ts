const LIST_CATEGORIES = [
  'i wanna practice grammar practice a1 level',  
  'i wanna practice grammar practice a2 level',  
  'i wanna practice grammar practice b1 level',  
  'i wanna practice grammar practice b2 level',
  'i wanna practice grammar practice c1 level',
  'i wanna practice grammar practice c2 level',
  'i wanna practice compound words',
  'i wanna practice adjectives and adverbs grammar',
  'i wanna practice adjectives grammar',
  'i wanna practice adverb grammar',
  'i wanna practice articles grammar',
  'i wanna practice auxiliary verb grammar',
  'i wanna practice conjunction grammar',
  'i wanna practice determiners grammar',
  'i wanna practice gerunds and infinitive grammar',
  'i wanna practice gerunds grammar',
  'i wanna practice infinitive grammar',
  'i wanna practice modal verb grammar',
  'i wanna practice phrasal verb grammar',
  'i wanna practice preposition grammar',
  'i wanna practice verb grammar',
  'i wanna practice vocabulary',
]

export async function GET() {
  return Response.json(LIST_CATEGORIES)
}
