import React from "react";
import Vision from "@/components/Vision";

export default function VisionPage({
    searchParams,
}: {
    searchParams: Promise<{ mode?: string; roomId?: string }>;
}) {
    const sp = React.use(searchParams);
    const initialMode = sp.mode === "host" ? "host" : "viewer";
    const initialRoomId = sp.roomId; // можна undefined — Vision сам згенерує

    return <Vision initialMode={initialMode as "host" | "viewer"} initialRoomId={initialRoomId} />;
}
