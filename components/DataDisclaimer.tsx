import { DATA_DISCLAIMER } from "@/lib/constants";

interface Props {
  dataVersion: string;
  generatedAt: string;
}

export function DataDisclaimer({ dataVersion, generatedAt }: Props) {
  const date = new Date(generatedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-[#FFF8E1] border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900">
      <span className="font-medium">Data: </span>
      {dataVersion} | Generated {date} | {DATA_DISCLAIMER}
    </div>
  );
}
