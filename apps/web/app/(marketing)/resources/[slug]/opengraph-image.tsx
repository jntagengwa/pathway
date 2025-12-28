import { ImageResponse } from "next/og";
import { getResourceBySlug } from "../../../../lib/resources";

export const alt = "Resource";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 60,
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
          }}
        >
          <div style={{ color: "#1e40af", fontWeight: "bold", marginBottom: "20px" }}>
            Nexsteps
          </div>
          <div style={{ color: "#6b7280" }}>Resource Not Found</div>
        </div>
      ),
      {
        ...size,
      }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "60px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ color: "#1e40af", fontWeight: "bold", fontSize: 40 }}>
            Nexsteps Resources
          </div>
          <div
            style={{
              color: "#111827",
              fontWeight: "bold",
              fontSize: 56,
              lineHeight: 1.2,
            }}
          >
            {resource.title}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "40px",
          }}
        >
          {resource.sectors.slice(0, 3).map((sector) => (
            <div
              key={sector}
              style={{
                backgroundColor: "#dbeafe",
                color: "#1e40af",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: 20,
                textTransform: "capitalize",
              }}
            >
              {sector}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

