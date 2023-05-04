//create a component that will not be rendered on mobile
//this is because the audio response is not supported on mobile
//so we will render a message that tells the user to use a desktop
//browser instead

import React from "react";

export default function NotOnMobile() {
  return (
    <div className="px-10 my-element mx-auto">
      <div className="h-full flex flex-col content-center justify-center space-y-4">
        <h1 className="text-center text-3xl">
          SnoopGPT Not Supported on Mobile Browsers
        </h1>
        <p className="text-center text-md">
          Due to the inconsistencies in audio recording capabilities across
          mobile browsers, Snoop GPT is currently unavailable on mobile devices.
          For the best user experience, please access this application using a
          desktop browser :)
        </p>
      </div>
    </div>
  );
}
