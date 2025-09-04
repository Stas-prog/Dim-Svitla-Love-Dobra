import Image from "next/image";

type Snap = {
  _id: string;
  roomId: string;
  url: string;       // <— тепер звідси
  publicId?: string; // <— якщо потрібно для трансформацій
  createdAt: string;
};

export default function Slide({ snap }: { snap: Snap }) {
  // можна робити оптимізовані трансформації на льоту (через query-параметри Cloudinary)
  // приклад: автоякість + обрізка по контейнеру 1200x800
  const transformed = snap.url.replace("/upload/", "/upload/f_auto,q_auto,c_fill,w_1200,h_800/");

  return (
    <div className="relative w-full aspect-[3/2]">
      <Image
        src={transformed}
        alt="snapshot"
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        className="object-cover rounded-lg"
        priority
      />
    </div>
  );
}
