import { ReadingAttempt } from "@/app/speak/stories/page";
import { Story } from "@/types/story";

interface Props {
  readingAttempts: ReadingAttempt[];
  clearReadingHistory: () => void;
  stories: Story[];
}

export default function HistoryAttempts({
  readingAttempts,
  clearReadingHistory,
  stories,
}: Props) {
  return (
    <>
      {readingAttempts.length > 0 && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-medium">Your Reading History</h2>
            <button
              onClick={clearReadingHistory}
              className="px-3 py-1 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 transition-colors text-sm font-medium"
            >
              Clear History
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Story</th>
                  <th className="px-4 py-2 text-left">Accuracy</th>
                  <th className="px-4 py-2 text-left">Duration</th>
                  <th className="px-4 py-2 text-left">Missed Words</th>
                </tr>
              </thead>
              <tbody>
                {readingAttempts
                  .sort((a, b) => b.date - a.date)
                  .slice(0, 10)
                  .map((attempt, index) => {
                    const story =
                      stories.find((s) => s.id === attempt.storyId) ||
                      stories[0];
                    return (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">
                          {new Date(attempt.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">{story.title}</td>
                        <td className="px-4 py-2">{attempt.accuracy}%</td>
                        <td className="px-4 py-2">
                          {attempt.duration.toFixed(1)} sec
                        </td>
                        <td className="px-4 py-2">
                          {attempt.missedWords.length > 0
                            ? attempt.missedWords.slice(0, 3).join(", ") +
                              (attempt.missedWords.length > 3
                                ? `... (+${
                                    attempt.missedWords.length - 3
                                  } more)`
                                : "")
                            : "None"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
