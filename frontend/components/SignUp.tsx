"use client"
import { useState } from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import FileToBase64 from "@/utility/FiletoBase64";
import { Toaster } from "./ui/toaster";
import { useToast } from "./ui/use-toast";
export default function SignUp() 
{

    const {toast} = useToast();

    const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT;

    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [img_data, setImgData] = useState("");
    const [nid, setNid] = useState("");
    const[location, setLocation] = useState("");
    const[phone, setPhone] = useState("");
    const [pic, setPic] = useState<boolean>(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            setPic(true);
            try {
                const binaryData = await FileToBase64(file);
                setImgData(binaryData);
            } catch (error) {
                console.error("Error converting file to binary:", error);
            }
        }
        else {
            setPic(false);
            setImgData("");
        }
    };

    async function signupHandler() {
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
        
        const response = await fetch(`${ENDPOINT}/auth/signup`, {
            method: 'POST',
            body: JSON.stringify(input),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();

        console.log(data);

        if(data?.detail && data?.detail ==="Success")
        {
            toast({
                title: "Signup Successful",
                description: "Your account has been created successfully"
            })

            router.push("/signin");
        }
        else
        {
            toast({
                title: "Signup Failed",
                description: data?.detail ?? "Failed to create account. Try again Later"
            })
        }
    }


    return (
        <div className="w-full h-full flex flex-col justify-center items-center bg-[var(--p-bg)]">
            <p className="text-xl font-semibold text-nowrap text-[var(--sec-bg)] mt-4 mb-10">
                BD Railway Online Ticket Booking
            </p>
            <div className="w-[90%] md:w-[80%] h-auto bg-[var(--sec-bg)] flex flex-col justify-center items-center rounded-2xl shadow-lg ">
                <p className="text-white text-2xl font-bold p-3">Sign Up</p>
                <input type="text" placeholder="Name" className="w-[80%] md:w-4/6 p-2 my-4 border-2 border-gray-500 rounded-lg" onChange={e => setName(e.target.value)} />
                <input type="email" placeholder="Email" className="w-[80%] md:w-4/6 p-2 my-4 border-2 border-gray-500 rounded-lg" onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" className="w-[80%] md:w-4/6 p-2 my-4 border-2 border-gray-500 rounded-lg" onChange={e => setPassword(e.target.value)} />
                <input type="text" placeholder="NID No." className="w-[80%] md:w-4/6 p-2 my-4 border-2 border-gray-500 rounded-lg" onChange={e => setNid(e.target.value)} />
                <input type="text" placeholder="Location" className="w-[80%] md:w-4/6 p-2 my-4 border-2 border-gray-500 rounded-lg" onChange={e => setLocation(e.target.value)} />
                <input type="text" placeholder="Phone No." className="w-[80%] md:w-4/6 p-2 my-4 border-2 border-gray-500 rounded-lg" onChange={e => setPhone(e.target.value)} />

                <p className="text-white text-md p-1">
                    {pic ? "Profile Picture Selected" : "Select Profile Picture"}  
                </p>
                {
                    pic && (<img src={img_data} className="w-20 h-20 rounded-full" />)
                }
                <input type="file" placeholder="Profile Picture" className="w-auto my-8 text-sm" onChange={handleFileChange} />
                <Button className="w-auto bg-blue-800 text-xl xl:text-2xl text-white mb-10" onClick={signupHandler}>Sign Up</Button>
            </div>
            <Toaster/>
        </div>

    )
}