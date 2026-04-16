"use client"
import React, { useEffect, useState } from 'react';
import FormatTime from '@/utility/FormatTime';
const PlaceCard = ({ place, isExpanded, onToggleExpand }: any) => {

    const [trains, setTrains] = useState([]);


    async function getTrains() {
        const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
        const response = await fetch(`${ENDPOINT}/place/${place.id}/trains`, {
            method: 'GET',
            headers: {
                'Authorization': localStorage.getItem("token") ?? "",
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        setTrains(data);
    }

    useEffect(() => {
        if (isExpanded && trains.length === 0) {
            getTrains();
        }
    }, [isExpanded]);


    return (
        <div className="card">
            <div className="card-header">
                <div className="bg-[var(--p-bg)] border-2 shadow-lg flex justify-between items-center rounded-lg m-5">
                    <h2 className="text-[var(--sec-bg)] text-lg md:text-2xl font-semibold tracking-wider p-3 m-5 text-nowrap">{place.name}</h2>
                    <button className="text-xl text-[var(--sec-bg)] p-3 m-5" onClick={
                        () => {
                            onToggleExpand();
                        }
                    }>
                        {isExpanded ? '▲' : '▼'}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="card-body flex flex-col justify-center items-center">
                    <h1 className='text-slate-400 text-2xl font-semibold p-1 m-2'>Trains</h1>
                    <div className='flex justify-around items-center w-full whitespace-nowrap overflow-x-auto'>
                        {trains.map((train: any) => (
                            <div key={train.id} className="bg-[var(--p-bg)] p-3 w-auto h-auto flex flex-col justify-center items-center shadow-lg rounded-lg border-2 m-4 whitespace-nowrap">
                                <h1 className='text-[var(--sec-bg)] text-lg md:text-2xl font-semibold p-1 m-2'>{train.name}</h1>
                                <div className="w-full flex justify-between items-center">
                                    <div className="flex flex-col justify-center items-center m-3">
                                        <h1 className='text-blue-500 text-sm md:text-lg font-semibold  m-1'>Incoming</h1>
                                        <h1 className='text-slate-500 text-sm md:text-md font-semibold  m-1'>Arrival Time: {FormatTime(train.incoming_arrival)}</h1>
                                        <h1 className='text-slate-500 text-sm md:text-md font-semibold  m-1'>Departure Time: {FormatTime(train.incoming_departure)}</h1>
                                    </div>
                                    <div className="flex flex-col justify-center items-center m-3">
                                        <h1 className='text-red-500 text-sm md:text-lg font-semibold  m-1'>Outgoing</h1>
                                        <h1 className='text-slate-500 text-sm md:text-md font-semibold  m-1'>Arrival Time: {FormatTime(train.outgoing_arrival)}</h1>
                                        <h1 className='text-slate-500 text-sm md:text-md font-semibold  m-1'>Departure Time: {FormatTime(train.outgoing_departure)}</h1>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            )}
        </div>
    );
};

export default PlaceCard;