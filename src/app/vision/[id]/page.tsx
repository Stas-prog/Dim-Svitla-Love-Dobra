import React from "react";
import Vision from "@/components/Vision";

export default function VisionByIdPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ mode?: string }>;
}) {
    const p = React.use(params);
    const sp = React.use(searchParams);

    const initialRoomId = p.id;
    const initialMode = sp.mode === "host" ? "host" : "viewer";

    return <Vision initialMode={initialMode as "host" | "viewer"} initialRoomId={initialRoomId} />;
}
