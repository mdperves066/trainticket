"use client"
import { useEffect, useState } from "react";
import { DatePicker } from "./ui/DatePicker";
import { useRouter } from "next/navigation";
import SearchModal from './SearchModal';
import { Button } from "./ui/button";
import FormatDate from "@/utility/FormatDate";

export default function TicketBooking() {
    const router = useRouter();

    const [places, setPlaces] = useState<any[]>([]);
    const [date, setDate] = useState(new Date());
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'from' | 'to'>('from');

    useEffect(() => {
        let token = localStorage.getItem("token") ?? "";
        if (!token) {
            router.push("/signin")
        }
    }, [router]);

    useEffect(() => {
        async function fetchPlaces() {
            const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
            const response = await fetch(`${ENDPOINT}/place/all`, {
                method: 'GET',
                headers: {
                    'Authorization': localStorage.getItem("token") ?? "",
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log("places fetched");
            setPlaces(data);
        }
        fetchPlaces();
    }, []);

    const getSuggestions = (value: string) => {
        const inputValue = value.trim().toLowerCase();
        const inputLength = inputValue.length;
        return inputLength === 0 ? [] : places.filter(place =>
            place.name.toLowerCase().includes(inputValue)
        );
    };

    const onSuggestionsFetchRequested = ({ value }: { value: string }) => {
        setSuggestions(getSuggestions(value));
    };

    const onSuggestionsClearRequested = () => {
        setSuggestions([]);
    };

    const handleSelect = (value: string) => {
        if (modalType === 'from') {
            setFrom(value);
        } else {
            setTo(value);
        }
    };

    function searchTrainHandler(){
        let from_id = places.find(place => place.name === from)?.id;
        let to_id = places.find(place => place.name === to)?.id;
        let dateFormat = FormatDate(date);

        router.push(`/book_tickets/search_trains?from=${from_id}&fromStation=${from}&to=${to_id}&toStation=${to}&date=${dateFormat}`);
    }

    return (
        <div className="w-full min-h-screen flex flex-col justify-start items-center">
            <h1 className="text-xl md:text-3xl font-bold text-[var(--sec-bg)] mt-5 mb-6">Ticket Booking</h1>
            <div 
                className="cursor-pointer w-[80%] flex flex-col justify-start items-start mx-5 my-2 bg-var[(--p-bg)] shadow-lg border-2 p-2 rounded-lg"
                onClick={() => { setModalType('from'); setIsModalOpen(true); }}
            >
                <h1 className="text-sm text-slate-500 p-1">From:</h1>
                <h1 className="text-lg text-slate-800 p-1">
                    {from ? from : "Select a station"}
                </h1>
            </div>
            <div 
                className="cursor-pointer w-[80%] flex flex-col justify-start items-start mx-5 my-2 bg-var[(--p-bg)] shadow-lg border-2 p-2 rounded-lg"
                onClick={() => { setModalType('to'); setIsModalOpen(true); }}
            >
                <h1 className="text-sm text-slate-500 p-1">To:</h1>
                <h1 className="text-lg text-slate-800 p-1">
                    {to ? to : "Select a station"}
                </h1>
            </div>
            <div className="w-5/6 flex flex-col justify-start items-center mx-5">
                <h1 className="text-sm md:text-lg text-slate-500 p-4">Select Journey Date:</h1>
                <DatePicker
                    date={date}
                    setDate={setDate}
                    className="border-gray-300 text-xl rounded-lg"
                />
            </div>
            <Button className="bg-blue-800 text-xl xl:text-2xl text-white my-7 p-6" onClick={searchTrainHandler}>
            Search Trains
            </Button>
            <SearchModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleSelect}
                modalType={modalType}
                suggestions={suggestions}
                onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                onSuggestionsClearRequested={onSuggestionsClearRequested}
            />
        </div>
    )
};