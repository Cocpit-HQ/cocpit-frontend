import Image from "next/image";

export default function AuthImagePanel() {
  return (
    <div className="hidden lg:block lg:w-[50%] bg-white pt-[22px] pb-[22px] pl-[22px]">
      <div className="relative h-full ml-[8vw] rounded-[1.5rem] overflow-hidden">
        <Image
          src="/assets/Rectangle 4.svg"
          alt="Opening Page"
          fill
          priority
        />
      </div>
    </div>
  );
}
