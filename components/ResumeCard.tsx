"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ResumeCardProps {
  className?: string;
  img: string;
  title: string;
  description: string;
  handleClick?: () => void;
}

const ResumeCard = ({
  className,
  img,
  title,
  description,
  handleClick,
}: ResumeCardProps) => {
  // Default behavior if handleClick isn't provided
  const openResumeModule = () => {
    // ✅ Change this URL to your actual Resume app URL
    window.open("http://localhost:5173", "_blank"); // new tab
  };

  return (
    <section
      className={cn(
        "bg-blue-2 px-4 py-6 flex flex-col justify-between w-full xl:max-w-[1200x] min-h-[200px] rounded-[14px] cursor-pointer",
        className
      )}
      onClick={handleClick || openResumeModule}
    >
      <div className="flex-center glassmorphism size-12 rounded-[10px]">
        <Image src={img} alt={title} width={27} height={27} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-lg font-normal">{description}</p>
      </div>
    </section>
  );
};

export default ResumeCard;
