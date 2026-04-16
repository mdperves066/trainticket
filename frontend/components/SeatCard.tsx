import { PiSeatFill } from "react-icons/pi";

export default function SeatCard({seat}:any) {
    return(
        <div className="bg-[var(--p-bg)] p-3 border-2 shadow-lg flex flex-col justify-center items-center rounded-lg m-3">
            <div className="flex justify-center items-center">
                        <PiSeatFill className="text-slate-500 w-[5] h-[5]" />
                        <h1 className="text-slate-500 text-md md:text-xl font-semibold tracking-wider p-2 my-2">{seat.type}</h1>
            </div>
            <h1 className="text-slate-800 text-sm md:text-lg font-semibold tracking-wider p-1 my-1">Price: {seat.price} Tk</h1>
            <h1 className="text-slate-800 text-sm md:text-lg font-semibold tracking-wider p-1 my-1">Capacity: {seat.capacity}</h1>
        </div>
    )
};
