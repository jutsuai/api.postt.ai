const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { title, subtitle, backgroundImageUrl } = req.body;

    // HTML content for the PNG
    const contentPage = `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: red;
        font-family: Arial, sans-serif;
        color: white;
        text-align: center;
        box-sizing: border-box;

        height: 100%;

                background-image: url("https://images.unsplash.com/photo-1629649095671-46de327d1734?q=80&w=1972&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        background-size: cover;
        background-position: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        position: relative;
        padding: 40px;
        margin: auto;
        box-sizing: border-box;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .title {
        font-size: 18px;
        font-weight: bold;
        text-align: start;

        margin-left: 17.5%;
      }
      .subtitle {
        font-size: 24px;
        line-height: 36px;
        margin-top: 5px;
        text-align: start;

        margin-left: 17.5%;
      }
      .container {
     

        // height: 100%;

        // flex: 1;

        // background-color: purple;

        // background-image: url("https://images.unsplash.com/photo-1629649095671-46de327d1734?q=80&w=1972&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        // background-size: cover;
        // background-position: center;
        // display: flex;
        // flex-direction: column;
        // justify-content: center;
        // align-items: flex-start;
        // position: relative;
        // padding: 40px;
        // margin: auto;
        // box-sizing: border-box;
        // box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .avatar-section {
        display: flex;
        gap: 8px;

        align-items: center;
      }
      .footer {
        display: flex;
        bottom: 40px;
        left: 0px;

        position: absolute;

        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 0 40px;
        box-sizing: border-box;
      }
      .avatar {
        height: 50px;
        width: 50px;
        object-fit: cover;
        border-radius: 50%;
        border: 2px solid white;
      }
      .avatar-info {
        display: flex;
        flex-direction: column;
        align-items: start;
        gap: 4px;
      }
      .avatar-info h4 {
        font-size: 16px;
        margin: 0;
        padding: 0;
      }
      .avatar-info p {
        font-size: 12px;
        margin: 0;
        padding: 0;
      }
      .outlined-text {
        position: absolute;
        left: 0px;

        bottom: -40%;

        font-size: 400px;
        font-weight: 800;
        opacity: 0.25;
        -webkit-text-fill-color: transparent;
        -webkit-text-stroke: 2px;
      }
      .next-button {
        background-color: #343434;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <p class="outlined-text">1</p>
      <div class="title">Your catchy title here</div>
      <div class="subtitle">
        Lorem ipsum dolor sit amet consectetur. Ornare metus nunc purus dui
        proin laoreet. Adipiscing mauris laoreet at pulvinar dui mi vitae vel
        malesuada.
      </div>

      <div class="footer">
        <div class="avatar-section">
          <img
            class="avatar"
            src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="User Avatar"
          />
          <div class="avatar-info">
            <h4>Saidul Badhon</h4>
            <p>@saidulbadhon</p>
          </div>
        </div>

        <div class="next-button">
          <svg
            fill="#ffffff"
            height="16px"
            width="16px"
            version="1.1"
            id="Capa_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 55.752 55.752"
            xml:space="preserve"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <g>
                <path
                  d="M43.006,23.916c-0.28-0.282-0.59-0.52-0.912-0.727L20.485,1.581c-2.109-2.107-5.527-2.108-7.637,0.001 c-2.109,2.108-2.109,5.527,0,7.637l18.611,18.609L12.754,46.535c-2.11,2.107-2.11,5.527,0,7.637c1.055,1.053,2.436,1.58,3.817,1.58 s2.765-0.527,3.817-1.582l21.706-21.703c0.322-0.207,0.631-0.444,0.912-0.727c1.08-1.08,1.598-2.498,1.574-3.912 C44.605,26.413,44.086,24.993,43.006,23.916z"
                ></path>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  </body>
</html>
`;

    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the viewport to match the desired PNG size
    await page.setViewport({ width: 1024, height: 1280 });

    // Set the content of the page
    await page.setContent(contentPage);

    // Generate the PNG
    const pngBuffer = await page.screenshot({ type: "png" });

    // Close the browser
    await browser.close();

    // Save the PNG to the file system
    const outputDir = path.resolve(__dirname, "../output");
    const fileName = `generated_${Date.now()}.png`;
    const filePath = path.join(outputDir, fileName);

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the file to the file system
    fs.writeFileSync(filePath, pngBuffer);
    console.log(`PNG saved at: ${filePath}`);

    // Send the PNG as a response
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", "attachment; filename=generated.png");
    res.send(pngBuffer);
  } catch (error) {
    console.error("Error generating PNG:", error);
    next(error);
  }
});

module.exports = router;

const htmlContentForMainPage = `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: red;
        font-family: Arial, sans-serif;
        color: white;
        text-align: center;
        box-sizing: border-box;
      }
      .title {
        font-size: 56px;
        font-weight: bold;
        text-align: start;
      }
      .subtitle {
        font-size: 24px;
        margin-top: 5px;
      }
      .container {
        background-image: url("https://images.unsplash.com/photo-1629649095671-46de327d1734?q=80&w=1972&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
        width: 100%;
        max-width: 512px;
        max-height: 640px;
        height: 100%;
        background-size: cover;
        background-position: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        position: relative;
        padding: 40px;
        margin: auto;
        box-sizing: border-box;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      .avatar-section {
        display: flex;
        gap: 8px;
        position: absolute;
        bottom: 40px;
        left: 40px;
        align-items: center;
      }
      .avatar {
        height: 50px;
        width: 50px;
        object-fit: cover;
        border-radius: 50%;
        border: 2px solid white;
      }
      .avatar-info {
        display: flex;
        flex-direction: column;
        align-items: start;
        gap: 4px;
      }
      .avatar-info h4 {
        font-size: 16px;
        margin: 0;
        padding: 0;
      }
      .avatar-info p {
        font-size: 12px;
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="title">Your catchy title here</div>
      <!-- <div class="subtitle">Default Subtitle</div> -->

      <div class="avatar-section">
        <img
          class="avatar"
          src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="User Avatar"
        />
        <div class="avatar-info">
          <h4>Saidul Badhon</h4>
          <p>@saidulbadhon</p>
        </div>
      </div>
    </div>
  </body>
</html>
`;
