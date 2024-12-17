"use client"
import { CiMail } from "react-icons/ci";

export default function Footer() {



    return (
        <div className="border-[var(--p-bg)] border-t-2 bg-[var(--sec-bg)] shadow-xl w-full h-auto flex flex-col justify-center items-center p-4">
            <p className="text-white text-xs md:text-lg font-semibold mt-4">© 2024 BD Railway. All rights reserved.</p>
            <div className="flex justify-center items-center">
                <CiMail className="w-6 h-6 text-white"/>
                <p className="text-white text-xs md:text-md m-1">
                    For contact:
                </p>
            </div>
            <p className="tracking-wider text-white text-xs md:text-md font-semibold underline mb-3">
                bdrailway@gmail.com
            </p>
        </div>
    )
}
