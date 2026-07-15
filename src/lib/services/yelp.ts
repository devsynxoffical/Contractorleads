export type YelpMatch = {
  url: string;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
};

export async function matchYelpBusiness(
  name: string,
  location: string
): Promise<YelpMatch | null> {
  const apiKey = process.env.YELP_FUSION_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://api.yelp.com/v3/businesses/search");
  url.searchParams.set("term", name);
  url.searchParams.set("location", location);
  url.searchParams.set("limit", "3");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    businesses?: Array<{
      name: string;
      url: string;
      rating?: number;
      review_count?: number;
      is_closed?: boolean;
    }>;
  };

  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = data.businesses?.find((b) => {
    const candidate = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      candidate.includes(normalizedName) ||
      normalizedName.includes(candidate) ||
      candidate === normalizedName
    );
  });

  if (!match || match.is_closed) return null;

  return {
    url: match.url,
    rating: match.rating,
    reviewCount: match.review_count,
    isActive: !match.is_closed,
  };
}
