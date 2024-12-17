"use client"
import { useEffect, useState } from "react";
import { BsTrainFreightFrontFill } from "react-icons/bs";
import { FaRoute } from "react-icons/fa6";
import { IoTicketSharp } from "react-icons/io5";
import { Button } from "./ui/button";
import { GiHamburgerMenu } from 'react-icons/gi';
import { RxCross2 } from "react-icons/rx";
import { usePathname,useRouter } from "next/navigation";

export default function NavBar({signin,div}:any) {
    const router = useRouter();
    const pathName = usePathname();
    const path = pathName.split("/").pop();



    const [isOpen, setIsOpen] = useState(false);
    const [activeDiv, setActiveDiv] = useState<string | null>(div);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [name,setName] = useState("");
    const [img_data, setImgData] = useState("");


    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleDivClick = (divName: string) => {
        setActiveDiv(divName);
    };

    function CheckAndDirect(url: string) {
        let token = localStorage.getItem("token") ?? "";
        if (!token) {
            router.push("/signin")
        }
        else {
            router.push(url)
        }
    }

     useEffect( () => {

        async function profileHandler()
        {
            try{
                let token = localStorage.getItem("token") ?? "";
    
                if (token) {
                    setIsSignedIn(true);
        
                    const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
        
                    const response = await fetch(`${ENDPOINT}/user/me`, {
                        method: 'GET',
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'application/json'
                        }
                    });
        
                    const data = await response.json();

                    if (data?.id)
                    {
                        setIsSignedIn(true)
                        setImgData(data.img_data);
                        setName(data.name);
                    }
                    else
                    {
                        setIsSignedIn(false)
                    }
        
        
                }
                else {
                    setIsSignedIn(false);
                }
            }
            catch(e)
            {
                console.error(e);
            }
        }

        profileHandler();
 
    },[])

    function logoutHandler()
    {
        localStorage.removeItem("token");
        localStorage.removeItem("id");
        localStorage.removeItem("email");
        localStorage.removeItem("name");
        setIsSignedIn(false);
        router.push("/");
    }


    return (
        <div>
            <div className="bg-[var(--p-bg)] border-2 flex justify-between items-center">
                <img src="/logo.png" className="cursor-pointer w-[3rem] h-[3rem] md:w-[4rem] md:h-[4rem] mx-4"
                    onClick={() => {
                        router.push('/');
                    }
                    }></img>
                <div
                    className={`hidden pt-2 pb-2 md:flex justify-center items-center mx-4 cursor-pointer ${activeDiv === 'trainDetails' ? 'border-b-4 border-[var(--sec-bg)]' : ''}`}
                    onClick={() => {
                        handleDivClick('trainDetails');
                        CheckAndDirect("/train_details");
                    }}>
                    <BsTrainFreightFrontFill className="text-slate-700 w-[2rem] h-[2rem] md:w-[3rem] md:h-[3rem]" />
                    <p className="cursor-pointer text-md md:text-xl p-2 text-slate-700 font-semibold">Train Details</p>
                </div>
                <div
                    className={`hidden pt-2 pb-2 md:flex justify-center items-center mx-4 cursor-pointer ${activeDiv === 'routeDetails' ? 'border-b-4 border-[var(--sec-bg)]' : ''}`}
                    onClick={() => {
                        handleDivClick('routeDetails');
                        CheckAndDirect("/station_details");
                    }}>
                    <FaRoute className="text-slate-700 w-[2rem] h-[2rem] md:w-[3rem] md:h-[3rem]" />
                    <p className="cursor-pointer text-md md:text-xl p-2 text-slate-700 font-semibold">Station Details</p>
                </div>
                <div
                    className={`hidden pt-2 pb-2 md:flex justify-center items-center mx-4 cursor-pointer ${activeDiv === 'bookTicket' ? 'border-b-4 border-[var(--sec-bg)]' : ''}`}
                    onClick={() => {
                        handleDivClick('bookTicket');
                        CheckAndDirect("/book_tickets");
                    }}>
                    <IoTicketSharp className="text-slate-700 w-[2rem] h-[2rem] md:w-[3rem] md:h-[3rem]" />
                    <p className="cursor-pointer text-md md:text-xl p-2 text-slate-700 font-semibold">Book a ticket</p>
                </div>
                {(signin && !isSignedIn) && (<Button className="hidden md:block mx-4 bg-[var(--sec-bg)] text-sm md:text-lg" onClick={() => {
                    router.push("/signin")
                }}>Sign In</Button>)
                }
                {
                isSignedIn && 
                (
                    <div className="hidden md:flex justify-center items-center mx-2 cursor-pointer">
                        <img src={img_data?img_data:'/default_profile.png'} className={`${path=="profile" && "hidden"} w-[3rem] h-[3rem] md:w-[4rem] md:h-[4rem] rounded-full mx-3`} onClick={() => CheckAndDirect("/profile")}></img>
                        <Button className="bg-red-800 text-sm md:text-lg m-2" onClick={logoutHandler}>Log Out</Button>
                    </div>
                )

                }
                <div className="md:hidden flex items-center">
                    <GiHamburgerMenu className="text-slate-700 w-[2rem] h-[2rem] cursor-pointer" onClick={toggleMenu} />
                </div>
            </div>
            {
                isOpen && (
                    <div className="absolute shadow-xl top-0 left-0 w-full h-full bg-[var(--p-bg)] flex flex-col justify-start space-y-8 items-center z-50">
                        <div className="flex justify-between items-center w-full px-4 cursor-pointer">
                            <img src="/logo.png" onClick={() => {
                                router.push('/');
                            }
                            } className="w-[3rem] h-[3rem]" />
                            <RxCross2 className="w-[2rem] h-[2rem] cursor-pointer" onClick={toggleMenu} />
                        </div>
                        <div className="flex justify-center items-center p-3">
                            {
                                (signin && !isSignedIn) && (<Button className="bg-[var(--sec-bg)] text-sm" onClick={() => {
                                    router.push("/signin")
                                }}>Sign In</Button>)
                            }
                        </div>
                        {
                            isSignedIn && (
                                <div className="flex flex-col justify-center items-center mx-4 cursor-pointer">
                                    <img src={img_data?img_data:'default_profile.png'} className={`${path=="profile" && "hidden"} w-[4rem] h-[4rem] rounded-full my-2`} onClick={() => CheckAndDirect("/profile")}></img>
                                    <p className={`${path=="profile" && "hidden"} text-md text-[var(--sec-bg)] font-semibold my-2`}>{name}</p>
                                    <Button className="bg-red-800 text-sm md:text-lg" onClick={logoutHandler}>Log Out</Button>
                                </div>
                            )
                        }
                        <div
                            className={`p-3 inline-flex justify-center items-center  cursor-pointer ${activeDiv === 'trainDetails' ? 'border-b-4 border-[var(--sec-bg)]' : ''}`}
                            onClick={() => handleDivClick('trainDetails')}>
                            <BsTrainFreightFrontFill className="text-slate-700 w-[2rem] h-[2rem]" />
                            <p className="cursor-pointer text-md p-2 text-slate-700 font-semibold"
                            onClick={() => {
                                handleDivClick('trainDetails');
                                CheckAndDirect("/train_details");
                            }}>Train Details</p>
                        </div>
                        <div
                            className={`p-3 inline-flex justify-center items-center  cursor-pointer ${activeDiv === 'routeDetails' ? 'border-b-4 border-[var(--sec-bg)]' : ''}`}
                            onClick={() => {
                                handleDivClick('routeDetails');
                                CheckAndDirect("/station_details");
                            }}>
                            <FaRoute className="text-slate-700 w-[2rem] h-[2rem]" />
                            <p className="cursor-pointer text-md p-2 text-slate-700 font-semibold">Station Details</p>
                        </div>
                        <div
                            className={`p-3 inline-flex justify-center items-center  cursor-pointer ${activeDiv === 'bookTicket' ? 'border-b-4 border-[var(--sec-bg)]' : ''}`}
                            onClick={() => {
                                handleDivClick('bookTicket');
                                CheckAndDirect("/book_tickets");
                            }}>
                            <IoTicketSharp className="text-slate-700 w-[2rem] h-[2rem]" />
                            <p className="cursor-pointer text-md p-2 text-slate-700 font-semibold">Book a ticket</p>
                        </div>
                    </div>
                )
            }
        </div>

    );
}