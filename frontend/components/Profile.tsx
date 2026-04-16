"use client"
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import { useRouter } from "next/navigation";
import { useToast } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";
import FileToBase64 from "@/utility/FiletoBase64";
export default function Profile() {

    const router = useRouter();
    const { toast } = useToast();
    const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;
    const [isEdited, setIsEdited] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nid, setNid] = useState("");
    const [location, setLocation] = useState("");
    const [phone, setPhone] = useState("");
    const [img_data, setImgData] = useState("");

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    useEffect(() => {


        async function profileHandler() {
            try {
                let token = localStorage.getItem("token") ?? "";

                if (token) {

                    const response = await fetch(`${ENDPOINT}/user/me`, {
                        method: 'GET',
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await response.json();

                    if (data?.id) {
                        setName(data.name);
                        setEmail(data.email);
                        setPassword(data.password);
                        setNid(data.nid);
                        setLocation(data.location);
                        setPhone(data.phone);
                        setImgData(data.img_data);
                    }
                    else {
                        console.log("No data found");

                        toast({
                            title: "Error",
                            description: "No data found for this user",
                        })

                        router.push("/signin");


                    }
                }
                else {
                    console.log("No token found");

                    toast({
                        title: "Error",
                        description: "No token found",
                    })

                    router.push("/signin");
                }
            }
            catch (e) {
                console.error(e);
            }
        }

        profileHandler();

    }, [])

    async function updateHandler() {
        const input = {
            name: name,
            email: email,
            password: password,
            role: "USER",
            nid: nid,
            location: location,
            phone: phone,
            img_data: img_data

        }

        let token = localStorage.getItem("token") ?? "";

        const response = await fetch(`${ENDPOINT}/user/me`, {
            method: 'PUT',
            body: JSON.stringify(input),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ?? ""
            }
        });
        const data = await response.json();

        console.log(data);

        if (data?.detail && data?.detail === "Updated") {
            toast({
                title: "Update Successful",
                description: "Your account has been updated successfully"
            })

            setIsEdited(false);
            router.push("/profile");
        }
        else {
            toast({
                title: "Update Failed",
                description: data?.detail ?? "Failed to Update account. Try again Later"
            })

            setIsEdited(false);
            router.push("/profile");
        }
    }

    async function deleteButtonHandler() {
        let token = localStorage.getItem("token") ?? "";

        const response = await fetch(`${ENDPOINT}/user/me`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ?? ""
            }
        });
        const data = await response.json();

        console.log(data);

        if (data?.detail && data?.detail === "Deleted") {
            localStorage.removeItem("token");
            localStorage.removeItem("id");
            localStorage.removeItem("role");
            router.push("/signin");
        }
        else {
            toast({
                title: "Delete Failed",
                description: data?.detail ?? "Failed to Delete account. Try again Later"
            })
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            try {
                const binaryData = await FileToBase64(file);
                setImgData(binaryData);
            } catch (error) {
                console.error("Error converting file to binary:", error);
            }
        }
        else {
            setImgData("");
        }
    };

    const editButtonHandler = () => {
        setIsEdited(true);
    }


    return (
        <div className="relative bg-[var(--p-bg)] w-full h-screen flex flex-col justify-center items-center">

            {!isEdited ?
                (<>
                    <div className="relative w-full h-full flex flex-col justify-center items-center">
                        <p className="absolute top-[10%] left-1/2 transform -translate-x-1/2 z-10 text-4xl font-bold text-white">
                            Profile
                        </p>
                        <div className="absolute top-0 left-0 w-full h-1/3 bg-[var(--sec-bg)]"></div>
                        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-[var(--p-bg)]"></div>
                        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <img
                                src={img_data ? img_data : '/default_profile.png'}
                                className="w-[9rem] h-[9rem] md:w-[11rem] md:h-[11rem] rounded-full"
                            />
                        </div>
                        <div className="absolute w-full mt-1 top-[calc(33%+5rem)] md:top-[calc(33%+6rem)] left-1/2 transform -translate-x-1/2 flex flex-col justify-center items-center">
                            <Button className="bg-orange-600 text-white text-sm md:text-md mb-2" onClick={editButtonHandler}>
                                Edit Profile
                            </Button>
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-0">
                                <p className="text-gray-800 text-sm md:text-md font-semibold  p-1">Name:</p>
                                <p className="text-[var(--sec-bg)] text-sm md:text-md font-semibold mx-2 p-1">{name}</p>
                            </div>
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-0">
                                <p className="text-gray-800 text-sm md:text-md font-semibold p-1">Email:</p>
                                <p className="text-[var(--sec-bg)] text-sm md:text-md font-semibold mx-2 p-1">{email}</p>
                            </div>
                            <div className="w-full md:w-3/6 h-auto flex justify-between items-center p-0">
                                <p className="text-gray-800 text-sm md:text-md font-semibold  p-1">Password:</p>
                                <div className="flex items-center">
                                    <p className="text-[var(--sec-bg)] text-sm md:text-md font-semibold mx-2 p-1">
                                        {isPasswordVisible ? password : '•••••••'}
                                    </p>
                                    <button onClick={togglePasswordVisibility} className="mx-2 p-1">
                                        {isPasswordVisible ? <BsEyeSlash className="text-[var(--sec-bg)]" /> : <BsEye className="text-[var(--sec-bg)]" />}
                                    </button>
                                </div>
                            </div>
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-0">
                                <p className="text-gray-800 text-sm md:text-md font-semibold p-1">NID:</p>
                                <p className="text-[var(--sec-bg)] text-sm md:text-md font-semibold mx-2 p-1">{nid}</p>
                            </div>
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-0">
                                <p className="text-gray-800 text-sm md:text-md font-semibold p-1">Location:</p>
                                <p className="text-[var(--sec-bg)] text-sm md:text-md font-semibold mx-2 p-1">{location}</p>
                            </div>
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-0">
                                <p className="text-gray-800 text-sm md:text-md font-semibold p-1">Phone:</p>
                                <p className="text-[var(--sec-bg)] text-sm md:text-md font-semibold mx-2 p-1">{phone}</p>
                            </div>

                            <Button className="bg-red-800 text-white text-sm md:text-md mt-1 md:mt-2 mb-1 p-1" onClick={deleteButtonHandler}>
                                Delete profile
                            </Button>


                        </div>
                    </div>
                </>
                ) :
                (<>
                    <div className="relative w-full min-h-screen flex flex-col justify-center items-center">
                        <p className="absolute top-[10%] left-1/2 transform -translate-x-1/2 z-10 text-md md:text-4xl font-bold text-white">
                            Edit Profile
                        </p>
                        <div className="absolute top-0 left-0 w-full h-1/3 bg-[var(--sec-bg)]"></div>
                        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-[var(--p-bg)]"></div>
                        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <img
                                src={img_data ? img_data : '/default_profile.png'}
                                className="w-[6rem] h-[6rem] md:w-[10rem] md:h-[10rem] rounded-full"
                            />
                        </div>
                        <div className="absolute w-full  top-[calc(33%+3rem)] md:top-[calc(33%+6rem)] left-1/2 transform -translate-x-1/2 flex flex-col justify-center items-center">
                            <input type="file" placeholder="Profile Picture" className="w-auto mb-1 md:my-2 text-sm" onChange={handleFileChange} />
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-1">
                                <p className="text-gray-800 text-xs md:text-md font-semibold p-1 ">Name:</p>
                                <input type="text" placeholder={name} className="w-4/6  p-1 border-2 border-gray-500 rounded-lg text-xs md:text-sm" onChange={e => setName(e.target.value)} />

                            </div>
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-1">
                                <p className="text-gray-800 text-xs md:text-md font-semibold p-1">Email:</p>
                                <input type="email" placeholder={email} className="w-4/6  p-1 border-2 border-gray-500 rounded-lg text-xs md:text-sm" onChange={e => setEmail(e.target.value)} />

                            </div>
                            <div className="w-full md:w-3/6 h-auto flex justify-between items-center p-1">
                                <p className="text-gray-800 text-xs md:text-md font-semibold  p-1">Password:</p>
                                <input type="password" placeholder="Enter the new Password" className="w-4/6  p-1 border-2 border-gray-500 rounded-lg text-xs md:text-sm" onChange={e => setPassword(e.target.value)} />
                            </div>
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-1">
                                <p className="text-gray-800 text-xs md:text-md font-semibold p-1">NID:</p>
                                <input type="text" placeholder={nid} className="w-4/6  p-1 border-2 border-gray-500 rounded-lg text-xs md:text-sm" onChange={e => setNid(e.target.value)} />

                            </div>
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-1">
                                <p className="text-gray-800 text-xs md:text-md font-semibold p-1">Location:</p>
                                <input type="text" placeholder={location} className="w-4/6 my-1 p-1 border-2 border-gray-500 rounded-lg text-xs md:text-sm" onChange={e => setLocation(e.target.value)} />

                            </div>
                            <div className="w-full  md:w-3/6 h-auto flex justify-between items-center p-1">
                                <p className="text-gray-800 text-xs md:text-md font-semibold p-1">Phone:</p>
                                <input type="text" placeholder={phone} className="w-4/6  p-1 border-2 border-gray-500 rounded-lg text-xs md:text-sm" onChange={e => setPhone(e.target.value)} />
                            </div>

                            <div className="w-4/6 md:w-2/5 h-auto flex justify-between items-center md:mt-2 mb-4 p-0 ">
                                <Button className="bg-orange-600 text-white text-xs md:text-sm" onClick={updateHandler} >
                                    Update
                                </Button>
                                <Button className="bg-red-800 text-white text-xs md:text-sm" onClick={() => setIsEdited(false)}>
                                    Cancel
                                </Button>
                            </div>

                        </div>
                    </div>
                </>
                )
            }
            <Toaster />
        </div>

    )
}