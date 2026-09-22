"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { FaTicketAlt, FaUser, FaDownload, FaBan } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useToast } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";
import FileToBase64 from "@/utility/FiletoBase64";
import GenerateTicketPDF from "@/utility/GenerateTicketPDF";

export default function Profile() {
  const router = useRouter();
  const { toast } = useToast();
  const ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT || "http://localhost:8000";

  const [activeTab, setActiveTab] = useState<"profile" | "bookings">("profile");
  const [isEdited, setIsEdited] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nid, setNid] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [img_data, setImgData] = useState("");

  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  useEffect(() => {
    async function profileHandler() {
      try {
        let token = localStorage.getItem("token") ?? "";
        if (!token) {
          router.push("/signin");
          return;
        }

        const response = await fetch(`${ENDPOINT}/user/me`, {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (data?.id) {
          setName(data.name || "");
          setEmail(data.email || "");
          setPassword(data.password || "");
          setNid(data.nid || "");
          setLocation(data.location || "");
          setPhone(data.phone || "");
          setImgData(data.img_data || "");
        } else {
          toast({
            title: "Session Expired",
            description: "Please sign in again.",
          });
          router.push("/signin");
        }
      } catch (e) {
        console.error("Profile error:", e);
      }
    }

    profileHandler();
    fetchUserTickets();
  }, []);

  async function fetchUserTickets() {
    setIsLoadingTickets(true);
    try {
      const token = localStorage.getItem("token") ?? "";
      if (!token) return;

      const response = await fetch(`${ENDPOINT}/booking/user/my-tickets`, {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (e) {
      console.error("Error fetching tickets:", e);
    } finally {
      setIsLoadingTickets(false);
    }
  }

  async function cancelTicketHandler(ticketId: number) {
    if (!confirm("Are you sure you want to cancel this ticket reservation?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token") ?? "";
      const response = await fetch(
        `${ENDPOINT}/booking/ticket/${ticketId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Ticket Cancelled",
          description: "Your reservation has been cancelled and seats released.",
        });
        fetchUserTickets();
      } else {
        toast({
          title: "Cancellation Failed",
          description: data?.detail || "Could not cancel ticket.",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to connect to server.",
      });
    }
  }

  function downloadTicketHandler(ticket: any) {
    const userObj = {
      name: name || "Passenger",
      email: email,
      phone: phone,
      nid: nid,
    };
    const seatNums = ticket.seat_numbers
      ? ticket.seat_numbers.split(",").map((s: string) => parseInt(s.trim()) || s.trim())
      : [];

    GenerateTicketPDF(
      userObj,
      ticket.train_name,
      ticket.from_station,
      ticket.to_station,
      ticket.seat_type,
      seatNums,
      ticket.journey_date,
      ticket.departure_time,
      ticket.arrival_time,
      ticket.total_price
    );
  }

  async function updateHandler() {
    const input = {
      name: name,
      email: email,
      password: password,
      role: "USER",
      nid: nid,
      location: location,
      phone: phone,
      img_data: img_data,
    };

    let token = localStorage.getItem("token") ?? "";

    const response = await fetch(`${ENDPOINT}/user/me`, {
      method: "PUT",
      body: JSON.stringify(input),
      headers: {
        "Content-Type": "application/json",
        Authorization: token ?? "",
      },
    });
    const data = await response.json();

    if (data?.detail && data?.detail === "Updated") {
      toast({
        title: "Update Successful",
        description: "Your account has been updated successfully",
      });
      setIsEdited(false);
    } else {
      toast({
        title: "Update Failed",
        description: data?.detail ?? "Failed to Update account.",
      });
      setIsEdited(false);
    }
  }

  async function deleteButtonHandler() {
    if (!confirm("Are you sure you want to permanently delete your account?")) {
      return;
    }
    let token = localStorage.getItem("token") ?? "";

    const response = await fetch(`${ENDPOINT}/user/me`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ?? "",
      },
    });
    const data = await response.json();

    if (data?.detail && data?.detail === "Deleted") {
      localStorage.clear();
      router.push("/signin");
    } else {
      toast({
        title: "Delete Failed",
        description: data?.detail ?? "Failed to Delete account.",
      });
    }
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      try {
        const binaryData = await FileToBase64(file);
        setImgData(binaryData);
      } catch (error) {
        console.error("Error converting file to binary:", error);
      }
    } else {
      setImgData("");
    }
  };

  return (
    <div className="bg-[var(--p-bg)] w-full min-h-screen flex flex-col items-center pb-12">
      {/* Top Header Banner */}
      <div className="w-full bg-[var(--sec-bg)] py-8 flex flex-col items-center justify-center text-white shadow-md">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide">
          User Dashboard
        </h1>
        <p className="text-sm md:text-md text-emerald-100 mt-1">
          Manage your personal profile and view your train reservations
        </p>

        {/* Tab Switcher */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-full font-medium transition text-sm md:text-base ${
              activeTab === "profile"
                ? "bg-white text-[var(--sec-bg)] shadow"
                : "bg-emerald-800 text-white hover:bg-emerald-700"
            }`}
          >
            <FaUser className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-full font-medium transition text-sm md:text-base ${
              activeTab === "bookings"
                ? "bg-white text-[var(--sec-bg)] shadow"
                : "bg-emerald-800 text-white hover:bg-emerald-700"
            }`}
          >
            <FaTicketAlt className="w-4 h-4" />
            <span>My Bookings</span>
            {tickets.length > 0 && (
              <span className="ml-1 bg-amber-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                {tickets.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="w-full max-w-4xl px-4 mt-8">
        {activeTab === "profile" ? (
          !isEdited ? (
            /* View Profile Card */
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col items-center border border-gray-100">
              <div className="relative mb-6">
                <img
                  src={img_data ? img_data : "/default_profile.png"}
                  alt="Profile"
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-[var(--sec-bg)] shadow-md"
                />
              </div>

              <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
              <p className="text-gray-500 text-sm mb-6">{email}</p>

              <div className="w-full max-w-md space-y-3 mb-8 text-sm md:text-base">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Full Name:</span>
                  <span className="text-gray-800 font-semibold">{name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Email:</span>
                  <span className="text-gray-800 font-semibold">{email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Password:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-800 font-semibold">
                      {isPasswordVisible ? password : "••••••••"}
                    </span>
                    <button
                      onClick={togglePasswordVisibility}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isPasswordVisible ? <BsEyeSlash /> : <BsEye />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">NID Number:</span>
                  <span className="text-gray-800 font-semibold">{nid}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Location:</span>
                  <span className="text-gray-800 font-semibold">{location}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Phone:</span>
                  <span className="text-gray-800 font-semibold">{phone}</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium shadow transition"
                  onClick={() => setIsEdited(true)}
                >
                  Edit Profile
                </Button>
                <Button
                  className="bg-red-700 hover:bg-red-800 text-white px-6 py-2 rounded-lg font-medium shadow transition"
                  onClick={deleteButtonHandler}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          ) : (
            /* Edit Profile Form */
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col items-center border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Edit Profile Information
              </h2>

              <div className="mb-4 flex flex-col items-center">
                <img
                  src={img_data ? img_data : "/default_profile.png"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 mb-2"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="w-full max-w-md space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Password (leave unchanged or enter new)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    NID Number
                  </label>
                  <input
                    type="text"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 rounded-lg font-medium shadow transition"
                  onClick={updateHandler}
                >
                  Save Changes
                </Button>
                <Button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium shadow transition"
                  onClick={() => setIsEdited(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )
        ) : (
          /* Bookings History Section */
          <div className="space-y-4">
            {isLoadingTickets ? (
              <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
                Loading your booked tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center flex flex-col items-center">
                <FaTicketAlt className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  No Tickets Booked Yet
                </h3>
                <p className="text-gray-500 text-sm max-w-sm mb-6">
                  You haven't made any train reservations yet. Search trains and
                  book your journey in just a few clicks!
                </p>
                <Button
                  className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-2.5 rounded-lg shadow font-medium"
                  onClick={() => router.push("/book_tickets")}
                >
                  Search & Book Tickets
                </Button>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 md:p-6 transition hover:shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg md:text-xl font-bold text-gray-800">
                        {ticket.train_name}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          ticket.status === "CONFIRMED"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold text-gray-800">
                          {ticket.from_station}
                        </span>{" "}
                        →{" "}
                        <span className="font-semibold text-gray-800">
                          {ticket.to_station}
                        </span>
                      </div>
                      <div>
                        Date:{" "}
                        <span className="font-medium text-gray-800">
                          {ticket.journey_date}
                        </span>
                      </div>
                      <div>
                        Time:{" "}
                        <span className="font-medium text-gray-800">
                          {ticket.departure_time} - {ticket.arrival_time}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-4">
                      <span>
                        Class: <strong>{ticket.seat_type}</strong>
                      </span>
                      <span>
                        Seat No(s): <strong>{ticket.seat_numbers}</strong>
                      </span>
                      <span>
                        Fare:{" "}
                        <strong className="text-emerald-700">
                          {ticket.total_price} Tk
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 self-end md:self-center">
                    <Button
                      onClick={() => downloadTicketHandler(ticket)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm flex items-center space-x-1.5 px-3 py-2 rounded-lg"
                    >
                      <FaDownload className="w-3 h-3" />
                      <span>PDF</span>
                    </Button>
                    {ticket.status === "CONFIRMED" && (
                      <Button
                        onClick={() => cancelTicketHandler(ticket.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm flex items-center space-x-1.5 px-3 py-2 rounded-lg"
                      >
                        <FaBan className="w-3 h-3" />
                        <span>Cancel</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Toaster />
    </div>
  );
}