import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import  GenerateTicketPDF  from '@/utility/GenerateTicketPDF';
import { useSearchParams } from 'next/navigation';
import { PiSeatFill } from "react-icons/pi";
import FormatTime from '@/utility/FormatTime';

export default function SearchSeatCard({ seat, date, path,dflag}: any) {

    const searchParams = useSearchParams();
    const from = searchParams.get("fromStation");
    const to = searchParams.get("toStation");
    const [isOpen, setIsOpen] = useState(false);
    const [count, setCount] = useState(1);

    const incrementCount = () => {
        if (count < seat.available) {
          setCount(count + 1);
        }
      };
    const decrementCount = () => setCount(count > 1 ? count - 1 : 1);

    async function buyTickets() {
        const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;

        const response = await fetch(`${ENDPOINT}/booking/seat/${seat.id}?count=${count}&date=${date}&dflag=${dflag}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        let train_name = data.train_name;
        let seat_name = data.seat_name;
        let seat_numbers = data.seat_numbers;
        let price = seat.price * count;
        let departure = FormatTime(path[0].leavetime);
        let reach = FormatTime(path[path.length - 1].reachtime);

        let token = localStorage.getItem("token");
        let  user;
        if (token) {
        
            const response = await fetch(`${ENDPOINT}/user/me`, {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            user = data;
        }


        GenerateTicketPDF(user,train_name,from,to,seat_name,seat_numbers,date,departure,reach,price);

        window.location.reload();
    }

    return (
        <>
            <div
                className="bg-[var(--p-bg)] p-3 border-2 shadow-lg flex flex-col justify-center items-center rounded-lg m-3 cursor-pointer"
                onClick={() => setIsOpen(true)}
            >
                {seat && (
                    <>
                        <div className="flex justify-center items-center">
                        <PiSeatFill className="text-slate-500 w-[5] h-[5]" />
                        <h1 className="text-slate-500 text-md md:text-xl font-semibold tracking-wider p-2 my-2">{seat.type}</h1>
                        </div>
                        <h1 className="text-slate-800 text-sm md:text-lg font-semibold tracking-wider p-1 my-1">Price: {seat.price} Tk</h1>
                        <h1 className="text-slate-800 text-sm md:text-lg font-semibold tracking-wider p-1 my-1">Available: {seat.available}</h1>
                    </>
                )}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <div />
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle className="flex justify-center items-center text-[var(--sec-bg)] text-2xl">Buy Tickets</DialogTitle>
                    <DialogDescription>
                        <div className='flex flex-col justify-center items-center'>
                            {seat && (
                                <>
                                    <p className='text-xl text-slate-500 m-2 p-2'>Type: {seat.type}</p>
                                    <p className='text-xl text-slate-500 m-2 p-2'>Price: {seat.price * count} Tk</p>
                                    <p className='text-xl text-slate-500 m-2 p-2'>Total Tickets: {count}</p>
                                    <div className="flex items-center space-x-4">
                                        <Button className="bg-red-700 p-4 rounded-md" onClick={decrementCount}>-</Button>
                                        <span>{count}</span>
                                        <Button className="bg-green-700 p-4 rounded-md" onClick={incrementCount}>+</Button>
                                    </div>
                                    <Button className="text-xl bg-blue-500 p-4 mt-6 mb-4" onClick={buyTickets}>Download Tickets</Button>
                                </>
                            )}
                        </div>
                    </DialogDescription>
                </DialogContent>
            </Dialog>
        </>
    );
}