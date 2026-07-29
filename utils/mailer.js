

import nodemailer from "nodemailer";

// Create transporter only once
const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
    ? nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
    : null;

// Verify SMTP connection only once when the server starts
if (transporter) {
    transporter
        .verify()
        .then(() => console.log("✅ Mail server ready"))
        .catch(err => console.error("❌ Mail server error:", err.message));
}

export const sendMail = async (to, otp) => {
    try {
        // Development mode
        if (!transporter) {
            console.log(`[DEV OTP] To: ${to} | OTP: ${otp}`);
            return;
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: "Your OTP Verification Code",
            html: `
                <div style="font-family: Arial, sans-serif; text-align:center;">
                    <h2>OTP Verification</h2>

                    <p>Your OTP is:</p>

                    <h1 style="color:#4CAF50; letter-spacing:5px;">
                        ${otp}
                    </h1>

                    <p>This OTP will expire in <b>2 minutes</b>.</p>

                    <p style="color:#888;font-size:14px">
                        If you didn't request this code, you can safely ignore this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("📧 Email sent:", info.response);

    } catch (error) {
        console.error("❌ Error sending email:", error.message);
        throw error;
    }
}






































































// import nodemailer from "nodemailer";


// // Create the transporter lazily so local dev can work without email credentials.
// export const sendMail = async (to, otp) => {
//     try {
//         if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
//             console.log(`[DEV OTP] To: ${to} | OTP: ${otp}`);
//             return;
//         }
//         let transporter;
//         if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
//             transporter = nodemailer.createTransport({
//                 service: "gmail",
//                 auth: {
//                     user: process.env.EMAIL_USER,
//                     pass: process.env.EMAIL_PASS
//                 }
//             });
//         }
//          await transporter.verify();
//         console.log("✅ Mail server ready");
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to,
//             subject: "Your OTP verification Code",
//             html: `<div style="font-family: Arial, sans-serif; text-align: center;">
//                     <h2>OTP Verification</h2>
//                     <p>Your OTP is:</p>
//                     <h1 style="color: #4CAF50;">${otp}</h1>
//                     <p>This OTP will expire in 2 minutes.</p>
//                 </div>`
//         }

//         const info = await transporter.sendMail(mailOptions)

//         console.log("Email sent:", info.response);


//     } catch (error) {
//         console.error("Error sending email:", error.message);

//         throw error
//     }
// }

