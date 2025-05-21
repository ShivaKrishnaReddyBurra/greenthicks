const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxConnections: 5,
  socketTimeout: 5000,
});

const sendVerificationEmail = async (email, token) => {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const mailOptions = {
      from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to GreenThicks! Confirm Your Email to Get Started',
      text: `Thank you for signing up with GreenThicks! Please verify your email by clicking the link below to activate your account:\n${verificationLink}\n\nIf you didn’t sign up, feel free to ignore this email.\n\nHappy shopping,\nThe GreenThicks Team`,
      html: `
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
            <tr>
              <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="position: relative; padding: 0;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                              <tr>
                                <td style="position: relative;">
                                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                    <tr>
                                      <td style="padding: 40px 30px; text-align: center;">
                                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Confirm Your Email</h1>
                                        <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">One step to join GreenThicks</p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 40px 30px 20px 30px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="color: #333333; font-size: 16px; line-height: 24px;">
                            <p style="margin-top: 0;">We're excited to have you join GreenThicks! Verify your email to start exploring our farm-fresh, organic produce delivered right to your door.</p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin: 30px 0;">
                              <tr>
                                <td>
                                  <a href="${verificationLink}" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">Confirm Your Account</a>
                                </td>
                              </tr>
                            </table>
                            <p>If the button doesn’t work, copy and paste this link into your browser:</p>
                            <p><a href="${verificationLink}" style="color: #27ae60; text-decoration: underline; word-break: break-all;">${verificationLink}</a></p>
                            <p>This link will expire in 24 hours. If you didn’t sign up for GreenThicks, please ignore this email.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 0 0 12px 12px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="color: #666666; font-size: 14px;">
                            <p style="margin: 0 0 10px;">Happy shopping!<br>The GreenThicks Team</p>
                            <div style="margin: 15px 0;">
                              <a href="https://facebook.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733547.png" alt="Facebook" style="width: 28px; filter: grayscale(100%);"></a>
                              <a href="https://x.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733579.png" alt="Twitter" style="width: 28px; filter: grayscale(100%);"></a>
                              <a href="https://instagram.com/greenthickss" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384063.png" alt="Instagram" style="width: 28px; filter: grayscale(100%);"></a>
                              <a href="https://www.linkedin.com/company/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733561.png" alt="LinkedIn" style="width: 28px; filter: grayscale(100%);"></a>
                            </div>
                            <p style="margin: 0;">
                              <a href="https://greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Visit our website</a> | 
                              <a href="mailto:greenthickss@gmail.com" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact Support</a>
                            </p>
                            <p style="margin: 10px 0 0; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                            <p style="margin: 5px 0 0; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      `,
    };
  
    await transporter.sendMail(mailOptions);
  };

const sendWelcomeEmail = async (email) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to GreenThicks!',
    text: 'Thank you for signing up with GreenThicks! We are excited to have you on board.',
    html: `
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                    <!-- Header with 3D effect and greenery -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="position: relative; padding: 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                                            <tr>
                                                <td style="position: relative;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                                        <tr>
                                                            <td style="padding: 40px 30px; text-align: center;"> <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                                                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Welcome to GreenThicks!</h1>
                                                                <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Your journey to fresh, healthy living begins now</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 16px; line-height: 24px;">
                                        <p style="margin-top: 0;">We're thrilled to have you as part of our community! At GreenThicks, we're passionate about bringing the freshest farm-to-table produce right to your doorstep.</p>
                                        
                                        <h4>Ready to start your healthy journey with us?</h4>
                                        
                                        <!-- CTA Button with 3D effect -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin: 30px 0;">
                                            <tr>
                                                <td>
                                                    <a href="https://greenthicks.live" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">Shop Now</a>
                                                </td>
                                            </tr>
                                        </table>    

                                        <!-- 3D Card with benefits -->
                                        <table border="2" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(145deg, #ffffff, #f9f9f9); border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.05), inset 0 -3px 0 rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.03);">
                                            <tr>
                                                <td>
                                                    <h3 style="color: #27ae60; margin-top: 0; font-size: 20px;">What makes us special:</h3>
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td width="60" valign="top" style="padding: 10px 15px 10px 0;">
                                                                <table border="0" cellpadding="0" cellspacing="0" width="50" style="background-color: rgba(46, 204, 113, 0.1); width: 50px; height: 50px; border-radius: 50%; text-align: center;">
                                                                    <tr>
                                                                        <td style="vertical-align: middle;">
                                                                            <img src="https://cdn-icons-png.flaticon.com/128/2153/2153786.png" alt="Fresh" width="25" style="display: block; margin: 0 auto;">
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                            <td valign="top" style="padding: 10px 0;">
                                                                <h4 style="margin: 0 0 5px; color: #333333;">Farm-Fresh Produce</h4>
                                                                <p style="margin: 0; color: #666666; font-size: 14px;">Harvested daily and delivered straight to your door</p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td width="60" valign="top" style="padding: 10px 15px 10px 0;">
                                                                <table border="0" cellpadding="0" cellspacing="0" width="50" style="background-color: rgba(46, 204, 113, 0.1); width: 50px; height: 50px; border-radius: 50%; text-align: center;">
                                                                    <tr>
                                                                        <td style="vertical-align: middle;">
                                                                            <img src="https://cdn-icons-png.flaticon.com/128/2454/2454282.png" alt="Organic" width="25" style="display: block; margin: 0 auto;">
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                            <td valign="top" style="padding: 10px 0;">
                                                                <h4 style="margin: 0 0 5px; color: #333333;">Organic & Pesticide-Free</h4>
                                                                <p style="margin: 0; color: #666666; font-size: 14px;">Grown with care for your health and the environment</p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td width="60" valign="top" style="padding: 10px 15px 10px 0;">
                                                                <table border="0" cellpadding="0" cellspacing="0" width="50" style="background-color: rgba(46, 204, 113, 0.1); width: 50px; height: 50px; border-radius: 50%; text-align: center;">
                                                                    <tr>
                                                                        <td style="vertical-align: middle;">
                                                                            <img src="https://cdn-icons-png.flaticon.com/128/2203/2203145.png" alt="Delivery" width="25" style="display: block; margin: 0 auto;">
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                            <td valign="top" style="padding: 10px 0;">
                                                                <h4 style="margin: 0 0 5px; color: #333333;">Fast & Reliable Delivery</h4>
                                                                <p style="margin: 0; color: #666666; font-size: 14px;">Convenient scheduling with real-time tracking</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>     
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                      <tr>
                        <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 0 0 12px 12px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #666666; font-size: 14px;">
                                        <p style="margin: 0 0 10px;">Happy shopping!<br>The GreenThicks Team</p>
                                        <div style="margin: 15px 0;">
                                            <a href="https://facebook.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733547.png" alt="Facebook" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://x.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733579.png" alt="Twitter" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://instagram.com/greenthickss" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384063.png" alt="Instagram" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://www.linkedin.com/company/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733561.png" alt="LinkedIn" style="width: 28px; filter: grayscale(100%);"></a>
                                            
                                        </div>
                                        <p style="margin: 0;">
                                            <a href="https://greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Visit our website</a> | 
                                            <a href="mailto:greenthickss@gmailcom" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact Support</a>
                                        </p>
                                        <p style="margin: 10px 0 0; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                </table>
            </td>
        </tr>
    </table>
</body>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendUserOrderPlacedEmail = async (email, order) => {
  const itemsList = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Order #${order.id} Has Been Placed`,
    text: `Thank you for your order (#${order.id}). Total: ₹${order.total.toFixed(2)}. View your order details at https://greenthicks.live/orders/${order.globalId}.`,
    html: `
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                    <!-- Header with 3D effect and greenery -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="position: relative; padding: 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                                            <tr>
                                                <td style="position: relative;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                                        <tr>
                                                            <td style="padding: 40px 30px; text-align: center;"> <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                                                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Thank You for Your Order!</h1>
                                                                <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Order #${order.id}</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Order Confirmation Message -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 16px; line-height: 24px;">
                                        <p style="margin-top: 0;">Your order has been successfully placed and is being prepared. Below are your order details:</p>
                                        
                                        <!-- Order Summary Card with 3D effect -->
                                        <div style="background: linear-gradient(145deg, #ffffff, #f9f9f9); border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.05), inset 0 -3px 0 rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.03);">
                                            <h3 style="color: #27ae60; margin-top: 0; font-size: 20px; border-bottom: 2px solid rgba(46, 204, 113, 0.1); padding-bottom: 10px;">Order Summary</h3>
                                            
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                                <thead>
                                                    <tr>
                                                        <th style="padding: 12px 15px; text-align: left; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600; border-radius: 6px 0 0 0;">Item</th>
                                                        <th style="padding: 12px 15px; text-align: center; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600;">Qty</th>
                                                        <th style="padding: 12px 15px; text-align: right; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600;">Price</th>
                                                        <th style="padding: 12px 15px; text-align: right; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600; border-radius: 0 6px 0 0;">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${itemsList}
                                                </tbody>
                                            </table>
                                            
                                            <!-- Order Totals -->
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
                                                <tr>
                                                    <td style="padding: 8px 0; color: #666;"><strong>Subtotal:</strong></td>
                                                    <td style="padding: 8px 0; text-align: right; color: #666;">₹${order.subtotal.toFixed(2)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #666;"><strong>Shipping:</strong></td>
                                                    <td style="padding: 8px 0; text-align: right; color: #666;">₹${order.shipping.toFixed(2)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #666;"><strong>Discount:</strong></td>
                                                    <td style="padding: 8px 0; text-align: right; color: #666;">-v${order.discount.toFixed(2)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 15px 0 8px; border-top: 2px solid rgba(46, 204, 113, 0.1); color: #333; font-size: 18px;"><strong>Total:</strong></td>
                                                    <td style="padding: 15px 0 8px; border-top: 2px solid rgba(46, 204, 113, 0.1); text-align: right; color: #27ae60; font-size: 18px; font-weight: 600;">$${order.total.toFixed(2)}</td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <!-- Shipping Information -->
                                        <div style="display: flex; margin: 30px 0;">
                                            <div style="flex: 1; padding-right: 15px;">
                                                <h3 style="color: #27ae60; margin-top: 0; font-size: 20px;">Shipping Address</h3>
                                                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #2ecc71;">
                                                    <p style="margin: 0 0 5px; font-weight: 600;">${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
                                                    <p style="margin: 0 0 5px;">${order.shippingAddress.address}</p>
                                                    <p style="margin: 0 0 5px;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                                                    <p style="margin: 10px 0 0;">${order.shippingAddress.phone}</p>
                                                </div>
                                            </div>
                                            <div style="flex: 1; padding-left: 15px;">
                                                <h3 style="color: #27ae60; margin-top: 0; font-size: 20px;">Estimated Delivery</h3>
                                                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #2ecc71;">
                                                    <p style="margin: 0 0 5px; font-size: 18px; font-weight: 600;">${new Date(Date.now() + 2*24*60*60*1000).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}</p>
                                                    <p style="margin: 0; color: #666;">Between 9:00 AM - 6:00 PM</p>
                                                    <p style="margin: 15px 0 0; font-size: 14px; color: #888;">You'll receive updates when your order ships.</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- CTA Button with 3D effect -->
                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="https://greenthicks.live/orders/${order.globalId}" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">Track Your Order</a>
                                        </div>
                                        
                                        <!-- Decorative vegetable image -->
                                        <div style="text-align: center; margin: 40px 0 20px;">
                                            <img src="https://images.unsplash.com/photo-1557844352-761f2ddf6d4a?w=800&auto=format&fit=crop&q=80" alt="Fresh Vegetables" width="100%" style="max-width: 500px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                      <tr>
                        <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 0 0 12px 12px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #666666; font-size: 14px;">
                                        <p style="margin: 0 0 10px;">Happy shopping!<br>The GreenThicks Team</p>
                                        <div style="margin: 15px 0;">
                                            <a href="https://facebook.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733547.png" alt="Facebook" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://x.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733579.png" alt="Twitter" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://instagram.com/greenthickss" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384063.png" alt="Instagram" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://www.linkedin.com/company/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733561.png" alt="LinkedIn" style="width: 28px; filter: grayscale(100%);"></a>
                                            
                                        </div>
                                        <p style="margin: 0;">
                                            <a href="https://greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Visit our website</a> | 
                                            <a href="mailto:greenthickss@gmail.com" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact Support</a>
                                        </p>
                                        <p style="margin: 10px 0 0; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                </table>
            </td>
        </tr>
    </table>
</body>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendAdminOrderPlacedEmail = async (email, order) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `New Order #${order.id} Placed`,
    text: `A new order (#${order.id}) has been placed. Total: ₹${order.total.toFixed(2)}. Please review and assign a delivery boy at https://greenthicks.live/admin/orders.`,
    html: `
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                    <!-- Header with 3D effect and greenery -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="position: relative; padding: 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                                            <tr>
                                                <td style="position: relative;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                                        <tr>
                                                            <td style="padding: 40px 30px; text-align: center;"> <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                                                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">New Order Notification</h1>
                                                                <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Journey to fresh, healthy living begins now</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 16px; line-height: 24px;">
                                        <p>A new order has been placed with the following details:</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> ₹${order.total.toFixed(2)}</p>
        <p><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
        <p>Please assign a delivery boy to this order.</p>
                                        
                                        <!-- CTA Button with 3D effect -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin: 30px 0;">
                                            <tr>
                                                <td>
                                                    <a href="https://greenthicks.live/admin/orders" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">Manage Order</a>
                                                </td>
                                            </tr>
                                        </table>            
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                      <tr>
                        <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 0 0 12px 12px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #666666; font-size: 14px;">
                                        <p style="margin: 0 0 10px;">The GreenThicks Team</p>
                                        <div style="margin: 15px 0;">
                                            <a href="https://facebook.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733547.png" alt="Facebook" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://x.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733579.png" alt="Twitter" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://instagram.com/greenthickss" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384063.png" alt="Instagram" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://www.linkedin.com/company/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733561.png" alt="LinkedIn" style="width: 28px; filter: grayscale(100%);"></a>
                                            
                                        </div>
                                        <p style="margin: 0;">
                                            <a href="https://greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Visit our website</a> | 
                                            <a href="mailto:greenthickss@gmailcom" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact Support</a>
                                        </p>
                                        <p style="margin: 10px 0 0; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                </table>
            </td>
        </tr>
    </table>
</body>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendUserDeliveryStatusEmail = async (email, order, status) => {
  const itemsList = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">v${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Delivery Status Update`,
    text: `Your order (#${order.id}) is now ${status.replace('-', ' ')}. Track your order at https://greenthicks.live/orders/${order.globalId}.`,
    html: `
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                    <!-- Header with 3D effect and greenery -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="position: relative; padding: 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                                            <tr>
                                                <td style="position: relative;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                                        <tr>
                                                            <td style="padding: 40px 30px; text-align: center;"> <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                                                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Delivery Status Update</h1>
                                                                <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Your order status has been updated to: <strong style="color: #fbff04; font-size: 20px; text-transform: uppercase;">${status.replace('-', ' ')}</strong></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Status Update Message -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 16px; line-height: 24px;">
                                        <p style="margin-top: 0; font-size: 18px;">Your order status has been updated to: <strong style="color: #27ae60; font-size: 20px; text-transform: uppercase;">${status.replace('-', ' ')}</strong></p>
                                        
                                        <!-- 3D Tracking Progress Bar -->
                                        <div style="background: linear-gradient(145deg, #ffffff, #f9f9f9); border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.05), inset 0 -3px 0 rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.03);">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td width="25%" align="center">
                <div style="position: relative; z-index: 1;">
                    <div style="background-color: #2ecc71; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);">
                        <span style="color: white; font-size: 16px; font-weight: bold;">✓</span>
                    </div>
                    <p style="margin: 8px 0 0; font-weight: 500; font-size: 12px; color: #333;">Order Placed</p>
                </div>
            </td>
            <td width="25%" align="center">
                <div style="position: relative; z-index: 1;">
                    <div style="${status === 'processing' || status === 'out-for-delivery' || status === 'delivered' ? 'background-color: #2ecc71; color: white; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);' : 'background-color: #e0e0e0; color: #666;'} width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                        <span style="font-size: 16px; font-weight: bold;">${status === 'processing' || status === 'out-for-delivery' || status === 'delivered' ? '✓' : '2'}</span>
                    </div>
                    <p style="margin: 8px 0 0; font-weight: 500; font-size: 12px; color: #333;">Processing</p>
                </div>
            </td>
            <td width="25%" align="center">
                <div style="position: relative; z-index: 1;">
                    <div style="${status === 'out-for-delivery' || status === 'delivered' ? 'background-color: #2ecc71; color: white; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);' : 'background-color: #e0e0e0; color: #666;'} width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                        <span style="font-size: 16px; font-weight: bold;">${status === 'out-for-delivery' || status === 'delivered' ? '✓' : '3'}</span>
                    </div>
                    <p style="margin: 8px 0 0; font-weight: 500; font-size: 12px; color: #333;">Out for Delivery</p>
                </div>
            </td>
            <td width="25%" align="center">
                <div style="position: relative; z-index: 1;">
                    <div style="${status === 'delivered' ? 'background-color: #2ecc71; color: white; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3);' : 'background-color: #e0e0e0; color: #666;'} width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                        <span style="font-size: 16px; font-weight: bold;">${status === 'delivered' ? '✓' : '4'}</span>
                    </div>
                    <p style="margin: 8px 0 0; font-weight: 500; font-size: 12px; color: #333;">Delivered</p>
                </div>
            </td>
        </tr>
        <!-- Progress line connecting circles -->
        <tr>
            <td colspan="4" style="position: relative;">
                <div style="position: absolute; top: -20px; left: 12%; right: 12%; height: 3px; background-color: #e0e0e0; z-index: 0;">
                    <div style="width: ${status === 'processing' ? '25%' : status === 'out-for-delivery' ? '65%' : status === 'delivered' ? '100%' : '0%'}; height: 100%; background-color: #2ecc71;"></div>
                </div>
            </td>
        </tr>
    </table>
</div>

                                        
                                        <!-- Status Message -->
                                        <div style="background-color: rgba(46, 204, 113, 0.05); padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2ecc71;">
                                            <p style="margin: 0; font-size: 16px;">
                                                ${status === 'processing' ? 'Your order is being prepared and packed with care. We\'re selecting the freshest produce for you!' : 
                                                status === 'out-for-delivery' ? 'Your order is on its way! Our delivery partner will arrive at your location soon.' : 
                                                status === 'delivered' ? 'Your order has been delivered successfully. Enjoy your fresh produce!' : 
                                                'Your order has been received and will be processed soon.'}
                                            </p>
                                        </div>
                                        
                                        <!-- Order Summary -->
                                        <h3 style="color: #27ae60; margin: 30px 0 15px; font-size: 20px; border-bottom: 2px solid rgba(46, 204, 113, 0.1); padding-bottom: 10px;">Order Summary</h3>
                                        
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                            <thead>
                                                <tr>
                                                    <th style="padding: 12px 15px; text-align: left; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600; border-radius: 6px 0 0 0;">Item</th>
                                                    <th style="padding: 12px 15px; text-align: center; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600;">Qty</th>
                                                    <th style="padding: 12px 15px; text-align: right; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600;">Price</th>
                                                    <th style="padding: 12px 15px; text-align: right; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600; border-radius: 0 6px 0 0;">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${itemsList}
                                            </tbody>
                                        </table>
                                        
                                        <p style="margin: 20px 0 0; text-align: right; font-size: 18px;"><strong>Total:</strong> <span style="color: #27ae60; font-weight: 600;">₹${order.total.toFixed(2)}</span></p>
                                        
                                        <!-- Delivery Address -->
                                        <h3 style="color: #27ae60; margin: 30px 0 15px; font-size: 20px; border-bottom: 2px solid rgba(46, 204, 113, 0.1); padding-bottom: 10px;">Delivery Address</h3>
                                        
                                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #2ecc71;">
                                            <p style="margin: 0 0 5px; font-weight: 600;">${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
                                            <p style="margin: 0 0 5px;">${order.shippingAddress.address}</p>
                                            <p style="margin: 0 0 5px;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                                            <p style="margin: 10px 0 0;">${order.shippingAddress.phone}</p>
                                        </div>
                                        
                                        <!-- CTA Button with 3D effect -->
                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="https://greenthicks.live/orders/${order.globalId}" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">Track Order</a>
                                        </div>
                                        
                                        <!-- Decorative vegetable image -->
                                        <div style="text-align: center; margin: 40px 0 20px;">
                                            <img src="https://images.unsplash.com/photo-1518843875459-f738682238a6?w=800&auto=format&fit=crop&q=80" alt="Fresh Vegetables" width="100%" style="max-width: 500px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                   <!-- Footer -->
                      <tr>
                        <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 0 0 12px 12px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #666666; font-size: 14px;">
                                        <p style="margin: 0 0 10px;">Happy shopping!<br>The GreenThicks Team</p>
                                        <div style="margin: 15px 0;">
                                            <a href="https://facebook.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733547.png" alt="Facebook" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://x.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733579.png" alt="Twitter" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://instagram.com/greenthickss" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384063.png" alt="Instagram" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://www.linkedin.com/company/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733561.png" alt="LinkedIn" style="width: 28px; filter: grayscale(100%);"></a>
                                            
                                        </div>
                                        <p style="margin: 0;">
                                            <a href="https://greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Visit our website</a> | 
                                            <a href="mailto:greenthickss@gmail.com" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact Support</a>
                                        </p>
                                        <p style="margin: 10px 0 0; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                </table>
            </td>
        </tr>
    </table>
</body>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendAdminDeliveryStatusEmail = async (email, order, status) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Delivery Status Update`,
    text: `Order (#${order.id}) is now ${status.replace('-', ' ')}. Review at https://greenthicks.live/admin/orders.`,
    html: `
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                    <!-- Header with 3D effect and greenery -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="position: relative; padding: 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                                            <tr>
                                                <td style="position: relative;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                                        <tr>
                                                            <td style="padding: 40px 30px; text-align: center;"> <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                                                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Delivery Status Update</h1>
                                                                <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Order (#${order.id}) has been updated to: <strong>${status.replace('-', ' ').toUpperCase()}</strong></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 16px; line-height: 24px;">
                                        <h2>Delivery Status Update</h2>
        <p>Order (#${order.id}) has been updated to: <strong>${status.replace('-', ' ').toUpperCase()}</strong></p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> ₹${order.total.toFixed(2)}</p>
        <p><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
        <p>Please review the order details in the admin panel.</p>
                                        
                                        <!-- CTA Button with 3D effect -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin: 30px 0;">
                                            <tr>
                                                <td>
                                                    <a href="https://greenthicks.live/admin/orders" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">Manage Order</a>
                                                </td>
                                            </tr>
                                        </table>            
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                      <tr>
                        <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 0 0 12px 12px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #666666; font-size: 14px;">
                                        <p style="margin: 0 0 10px;">The GreenThicks Team</p>
                                        <div style="margin: 15px 0;">
                                            <a href="https://facebook.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733547.png" alt="Facebook" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://x.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733579.png" alt="Twitter" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://instagram.com/greenthickss" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384063.png" alt="Instagram" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://www.linkedin.com/company/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733561.png" alt="LinkedIn" style="width: 28px; filter: grayscale(100%);"></a>
                                            
                                        </div>
                                        <p style="margin: 0;">
                                            <a href="https://greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Visit our website</a> | 
                                            <a href="mailto:greenthickss@gmailcom" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact Support</a>
                                        </p>
                                        <p style="margin: 10px 0 0; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                </table>
            </td>
        </tr>
    </table>
</body>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendDeliveryBoyDeliveryStatusEmail = async (email, order, status) => {
  const itemsList = order.items.map(item => `
    <li>${item.name} (Qty: ${item.quantity}, Price: ₹${item.price.toFixed(2)})</li>
  `).join('');

  const instructions = status === 'assigned' 
    ? 'Please prepare to pick up the order and update the status to "out-for-delivery" once you begin delivery.'
    : status === 'out-for-delivery'
    ? 'Please deliver the order to the customer and update the status to "delivered" upon completion.'
    : 'Thank you for completing the delivery. No further action is required.';

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Delivery Assignment Update`,
    text: `Order (#${order.id}) is now ${status.replace('-', ' ')}. Please follow the instructions at https://greenthicks.live/delivery/orders/${order.globalId}.`,
    html: `
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                   <!-- Header with 3D effect and greenery -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="position: relative; padding: 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                                            <tr>
                                                <td style="position: relative;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                                        <tr>
                                                            <td style="padding: 40px 30px; text-align: center;"> <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                                                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">New Order Notification</h1>
                                                                <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Order #${order.id}</strong></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Admin Notification Message -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 16px; line-height: 24px;">
                                        <p style="margin-top: 0; font-size: 18px;">A new order has been placed and requires your attention.</p>
                                        
                                        <!-- Order Info Card with 3D effect -->
                                        <div style="background: linear-gradient(145deg, #ffffff, #f9f9f9); border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.05), inset 0 -3px 0 rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.03);">
                                            <h3 style="color: #27ae60; margin-top: 0; font-size: 20px; border-bottom: 2px solid rgba(46, 204, 113, 0.1); padding-bottom: 10px;">Order Details</h3>
                                            
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                                <tr>
                                                    <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; color: #666; font-weight: 600; width: 40%;">Order ID:</td>
                                                    <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; color: #333;">${order.id}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; color: #666; font-weight: 600;">Order Date:</td>
                                                    <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; color: #333;">${new Date().toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; color: #666; font-weight: 600;">Total Amount:</td>
                                                    <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; color: #27ae60; font-weight: 600;">₹${order.total.toFixed(2)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; color: #666; font-weight: 600;">Payment Method:</td>
                                                    <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; color: #333;">Cash on Delivery</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px 15px; text-align: left; color: #666; font-weight: 600;">Status:</td>
                                                    <td style="padding: 12px 15px; text-align: left; color: #333;">
                                                        <span style="background-color: rgba(46, 204, 113, 0.1); color: #27ae60; padding: 5px 10px; border-radius: 4px; font-weight: 500;">New Order</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <!-- Customer Info -->
                                        <div style="display: flex; margin: 30px 0;">
                                            <div style="flex: 1; padding-right: 15px;">
                                                <h3 style="color: #27ae60; margin-top: 0; font-size: 20px;">Customer Information</h3>
                                                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #2ecc71;">
                                                    <p style="margin: 0 0 5px; font-weight: 600;">${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
                                                    <p style="margin: 0 0 5px;">${order.shippingAddress.email}</p>
                                                    <p style="margin: 0 0 5px;">${order.shippingAddress.phone}</p>
                                                </div>
                                            </div>
                                            <div style="flex: 1; padding-left: 15px;">
                                                <h3 style="color: #27ae60; margin-top: 0; font-size: 20px;">Shipping Address</h3>
                                                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #2ecc71;">
                                                    <p style="margin: 0 0 5px;">${order.shippingAddress.address}</p>
                                                    <p style="margin: 0 0 5px;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Action Required Message -->
                                        <div style="background-color: rgba(46, 204, 113, 0.05); padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2ecc71;">
                                            <p style="margin: 0; font-size: 16px; font-weight: 500;">
                                                Please assign a delivery person to this order as soon as possible.
                                            </p>
                                        </div>
                                        
                                        <!-- CTA Button with 3D effect -->
                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="https://greenthicks.live/admin/orders" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">Manage Order</a>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 20px 30px 40px 30px; color: #333333; font-size: 16px; line-height: 24px;">
                                        <p style="margin-bottom: 10px;">Thank you,<br>GreenThicks Admin System</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 30px; border-radius: 0 0 12px 12px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td align="center" style="color: #666666;">
                                                    <p style="margin: 0; font-size: 14px;">
                                                        <a href="https://greenthicks.live/admin" style="color: #27ae60; text-decoration: none; font-weight: 500;">Admin Dashboard</a> | 
                                                        <a href="mailto:fakebaba156@gmail.com" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact IT Support</a>
                                                    </p>
                                                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                                                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendUserOrderCancelledEmail = async (email, order) => {
  const itemsList = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Order #${order.id} Has Been Cancelled`,
    text: `Your order (#${order.id}) has been cancelled. Total: ₹${order.total.toFixed(2)}. For more details, visit https://greenthicks.live/orders/${order.globalId}.`,
    html: `
     <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                    <!-- Header with 3D effect and greenery -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="position: relative; padding: 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                                            <tr>
                                                <td style="position: relative;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                                        <tr>
                                                            <td style="padding: 40px 30px; text-align: center;"> <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                                                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Order Cancellation</h1>
                                                                <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Order #${order.id}</strong></p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Header with 3D effect -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="background: linear-gradient(135deg, #2ecc71, #27ae60); padding: 40px 30px; position: relative;">
                                        <!-- Decorative elements -->
                                        
                                        
                                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Order Cancellation</h1>
                                        <p style="color: white; margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Order #${order.id}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Cancellation Message -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 16px; line-height: 24px;">
                                        <p style="margin-top: 0; font-size: 18px;">Your order has been successfully cancelled.</p>
                                        
                                        <!-- Cancellation Notice -->
                                        <div style="background-color: rgba(46, 204, 113, 0.05); padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2ecc71;">
                                            <p style="margin: 0; font-size: 16px;">
                                                We've processed your cancellation request. If you paid for this order, a refund will be issued to your original payment method within 3-5 business days.
                                            </p>
                                        </div>
                                        
                                        <!-- Order Summary Card with 3D effect -->
                                        <div style="background: linear-gradient(145deg, #ffffff, #f9f9f9); border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.05), inset 0 -3px 0 rgba(0,0,0,0.02); border: 1px solid rgba(0,0,0,0.03);">
                                            <h3 style="color: #27ae60; margin-top: 0; font-size: 20px; border-bottom: 2px solid rgba(46, 204, 113, 0.1); padding-bottom: 10px;">Cancelled Order Summary</h3>
                                            
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                                <thead>
                                                    <tr>
                                                        <th style="padding: 12px 15px; text-align: left; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600; border-radius: 6px 0 0 0;">Item</th>
                                                        <th style="padding: 12px 15px; text-align: center; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600;">Qty</th>
                                                        <th style="padding: 12px 15px; text-align: right; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600;">Price</th>
                                                        <th style="padding: 12px 15px; text-align: right; background-color: rgba(46, 204, 113, 0.05); border-bottom: 1px solid #eee; color: #333; font-weight: 600; border-radius: 0 6px 0 0;">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${itemsList}
                                                </tbody>
                                            </table>
                                            
                                            <p style="margin: 20px 0 0; text-align: right; font-size: 18px;"><strong>Total:</strong> <span style="color: #27ae60; font-weight: 600;">₹${order.total.toFixed(2)}</span></p>
                                        </div>
                                        
                                        <p>If you have any questions about this cancellation or would like to place a new order, please don't hesitate to contact our customer support team.</p>
                                        
                                        <!-- CTA Button with 3D effect -->
                                        <div style="text-align: center; margin: 30px 0;">
                                            <a href="https://greenthicks.live" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">Shop Again</a>
                                        </div>
                                        
                                        <!-- Decorative vegetable image -->
                                        <div style="text-align: center; margin: 40px 0 20px;">
                                            <img src="https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=800&auto=format&fit=crop&q=80" alt="Fresh Vegetables" width="100%" style="max-width: 500px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                      <tr>
                        <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 0 0 12px 12px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #666666; font-size: 14px;">
                                        <p style="margin: 0 0 10px;">Happy shopping!<br>The GreenThicks Team</p>
                                        <div style="margin: 15px 0;">
                                            <a href="https://facebook.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733547.png" alt="Facebook" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://x.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733579.png" alt="Twitter" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://instagram.com/greenthickss" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384063.png" alt="Instagram" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://www.linkedin.com/company/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733561.png" alt="LinkedIn" style="width: 28px; filter: grayscale(100%);"></a>
                                            
                                        </div>
                                        <p style="margin: 0;">
                                            <a href="https://greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Visit our website</a> | 
                                            <a href="mailto:greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact Support</a>
                                        </p>
                                        <p style="margin: 10px 0 0; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                </table>
            </td>
        </tr>
    </table>
</body>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendAdminOrderCancelledEmail = async (email, order) => {
  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Cancelled`,
    text: `Order (#${order.id}) has been cancelled by the user. Total: ₹${order.total.toFixed(2)}. Review at https://greenthicks.live/admin/orders.`,
    html: `
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                    <!-- Header with 3D effect and greenery -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="position: relative; padding: 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                                            <tr>
                                                <td style="position: relative;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                                        <tr>
                                                            <td style="padding: 40px 30px; text-align: center;"> <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                                                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Order Cancellation Notification</h1>
                                                                <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Order (#${order.id}) has been cancelled by the user with the following details:</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 16px; line-height: 24px;">
                                        <p>Order (#${order.id}) has been cancelled by the user with the following details:</p>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> ₹${order.total.toFixed(2)}</p>
        <p><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
        <p>Please review the order details in the admin panel.</p>
                                        
                                        <!-- CTA Button with 3D effect -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin: 30px 0;">
                                            <tr>
                                                <td>
                                                    <a href="https://greenthicks.live/admin/orders" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">Manage Order</a>
                                                </td>
                                            </tr>
                                        </table>            
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                      <tr>
                        <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 0 0 12px 12px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #666666; font-size: 14px;">
                                        <p style="margin: 0 0 10px;">The GreenThicks Team</p>
                                        <div style="margin: 15px 0;">
                                            <a href="https://facebook.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733547.png" alt="Facebook" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://x.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733579.png" alt="Twitter" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://instagram.com/greenthickss" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384063.png" alt="Instagram" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://www.linkedin.com/company/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733561.png" alt="LinkedIn" style="width: 28px; filter: grayscale(100%);"></a>
                                            
                                        </div>
                                        <p style="margin: 0;">
                                            <a href="https://greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Visit our website</a> | 
                                            <a href="mailto:greenthickss@gmailcom" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact Support</a>
                                        </p>
                                        <p style="margin: 10px 0 0; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                </table>
            </td>
        </tr>
    </table>
</body>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendDeliveryBoyOrderCancelledEmail = async (email, order) => {
  const itemsList = order.items.map(item => `
    <li>${item.name} (Qty: ${item.quantity}, Price: ₹${item.price.toFixed(2)})</li>
  `).join('');

  const mailOptions = {
    from: `"GreenThicks Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order #${order.id} Cancelled`,
    text: `Order (#${order.id}) has been cancelled. No further action is required. View details at https://greenthicks.live/delivery/orders/${order.globalId}.`,
    html: `
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; color: #333333;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; margin: 20px auto;">
        <tr>
            <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.1);">
                    <!-- Header with 3D effect and greenery -->
                    <tr>
                        <td>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="position: relative; padding: 0;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-image: url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80'); background-size: cover; background-position: center; height: 300px; position: relative;">
                                            <tr>
                                                <td style="position: relative;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(46, 204, 113, 0.8), rgba(39, 174, 96, 0.9));">
                                                        <tr>
                                                            <td style="padding: 40px 30px; text-align: center;"> <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/mail_logo-7PdH4CLvM3N3aeqItNcDAhnEFKOK9Z.png" alt="GreenThicks Logo" width="150" style="display: block; margin: 0 auto 0px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                                                                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Order Cancellation Notification</h1>
                                                                <p style="color: white; margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Order (#${order.id}) has been cancelled by the user. No further action is required.</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px 20px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #333333; font-size: 16px; line-height: 24px;">
                                        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Total:</strong> ₹${order.total.toFixed(2)}</p>
        <p><strong>Items:</strong><ul>${itemsList}</ul></p>
        
        <p><strong>Customer:</strong> ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
                                        
                                        <!-- CTA Button with 3D effect -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: center; margin: 30px 0;">
                                            <tr>
                                                <td>
                                                    <a href="https://greenthicks.live/admin/orders" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); transition: all 0.3s ease;">View Order</a>
                                                </td>
                                            </tr>
                                        </table>            
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                      <tr>
                        <td style="background: linear-gradient(to right, #f9f9f9, #f0f0f0); padding: 20px; border-radius: 0 0 12px 12px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #666666; font-size: 14px;">
                                        <p style="margin: 0 0 10px;">The GreenThicks Team</p>
                                        <div style="margin: 15px 0;">
                                            <a href="https://facebook.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733547.png" alt="Facebook" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://x.com/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733579.png" alt="Twitter" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://instagram.com/greenthickss" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384063.png" alt="Instagram" style="width: 28px; filter: grayscale(100%);"></a>
                                            <a href="https://www.linkedin.com/company/greenthicks" style="display: inline-block; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/128/733/733561.png" alt="LinkedIn" style="width: 28px; filter: grayscale(100%);"></a>
                                            
                                        </div>
                                        <p style="margin: 0;">
                                            <a href="https://greenthicks.live" style="color: #27ae60; text-decoration: none; font-weight: 500;">Visit our website</a> | 
                                            <a href="mailto:greenthickss@gmailcom" style="color: #27ae60; text-decoration: none; font-weight: 500;">Contact Support</a>
                                        </p>
                                        <p style="margin: 10px 0 0; color: #888888;">© 2025 GreenThicks. All rights reserved.</p>
                                        <p style="margin: 5px 0 0; color: #888888; font-style: italic;">Fresh from Farm to Table</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                </table>
            </td>
        </tr>
    </table>
</body>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {  
  sendVerificationEmail,
  sendWelcomeEmail, 
  sendUserOrderPlacedEmail, 
  sendAdminOrderPlacedEmail, 
  sendUserDeliveryStatusEmail, 
  sendAdminDeliveryStatusEmail, 
  sendDeliveryBoyDeliveryStatusEmail,
  sendUserOrderCancelledEmail,
  sendAdminOrderCancelledEmail,
  sendDeliveryBoyOrderCancelledEmail 
};