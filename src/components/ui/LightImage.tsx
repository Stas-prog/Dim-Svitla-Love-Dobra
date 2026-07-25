import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  className?: string
};

export default function LightImage({ src, alt }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <Image
        src={src}
        alt={alt}
        width={1024}
        height={1024}
        priority
        className="
        w-full
        max-w-3xl
        mx-auto
        rounded-[40px]
        shadow-2xl
        "
      />
    </div>
  );
}