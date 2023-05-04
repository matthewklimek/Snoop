import Head from "next/head";
import React, { useEffect, useState } from "react";
import AudioResponse from "../components/audioResponse";
import NotOnMobile from "../components/notOnMobile";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  const isMobileBrowser = () => {
    if (typeof navigator === "undefined") {
      return false;
    }

    const userAgent = navigator.userAgent;
    return /Mobi|Android/i.test(userAgent);
  };

  useEffect(() => {
    setIsMobile(isMobileBrowser());

    const updateVhUnit = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    updateVhUnit();
    window.addEventListener("resize", updateVhUnit);

    return () => {
      window.removeEventListener("resize", updateVhUnit);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Snoop GPT</title>
        <meta
          name="description"
          content="A web app that used OpenAI's API to communicate with a Snoop Dogg inspired Chatbot"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {isMobile ? <NotOnMobile /> : <AudioResponse />}
    </>
  );
}
