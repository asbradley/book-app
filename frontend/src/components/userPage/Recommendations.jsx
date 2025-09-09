import { useEffect, useState } from "react";
import axios from "axios";

export default function Recommendations({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError("");

      try {
        // Call your backend route (not OpenAI directly!)
        const response = await axios.get(`/api/history/recommendations?user_id=${userId}`);
        const data = response.data;

        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        } else {
          setError("No recommendations available.");
          setRecommendations([]);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchRecommendations();
    }
  }, [userId]);

  if (loading) return <p>Loading recommendations...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Recommended Books</h2>
      <ul>
        {recommendations.map((book, idx) => (
          <li key={idx}>{book}</li>
        ))}
      </ul>
    </div>
  );
}

