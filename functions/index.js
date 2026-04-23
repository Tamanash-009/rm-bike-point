/**
 * Simulated Cloud Functions for R.M Bike Point
 * 
 * To deploy these, you would normally use the Firebase CLI:
 * 1. npm install -g firebase-tools
 * 2. firebase login
 * 3. firebase init functions
 * 4. Copy this code to functions/index.js
 * 5. firebase deploy --only functions
 * 
 * NOTE: Cloud Functions require the "Blaze" (pay-as-you-go) plan, 
 * but the free tier is very generous (2M invocations/month).
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * Daily job to delete users inactive for more than 1 year
 * Runs every day at midnight
 */
exports.deleteInactiveUsers = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const inactiveUsers = await db.collection('users')
    .where('lastLogin', '<', admin.firestore.Timestamp.fromDate(oneYearAgo))
    .get();

  const batch = db.batch();
  inactiveUsers.forEach(doc => {
    batch.delete(doc.ref);
    // Also delete from Auth
    admin.auth().deleteUser(doc.id).catch(err => console.error(`Error deleting user ${doc.id}:`, err));
  });

  await batch.commit();
  console.log(`Deleted ${inactiveUsers.size} inactive users.`);
  return null;
});

/**
 * Trigger: When a booking is marked as 'completed'
 * This can be used to send an email via the "Trigger Email" extension
 */
exports.onBookingCompleted = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.status === 'completed' && oldData.status !== 'completed') {
      // Create a document in the 'mail' collection for the "Trigger Email" extension
      await db.collection('mail').add({
        to: newData.userEmail,
        message: {
          subject: 'Service Completed - R.M Bike Point',
          text: `Hi ${newData.userName}, your service for ${newData.bikeModel} has been completed. Thank you for choosing R.M Bike Point!`,
          html: `<h1>Service Completed</h1><p>Hi ${newData.userName},</p><p>Your service for <b>${newData.bikeModel}</b> has been completed successfully.</p><p>Thank you for choosing R.M Bike Point!</p>`,
        },
      });
      console.log(`Completion email queued for ${newData.userEmail}`);
    }

    if (newData.status === 'confirmed' && oldData.status !== 'confirmed') {
      // Create a document in the 'mail' collection for the "Trigger Email" extension
      await db.collection('mail').add({
        to: newData.userEmail,
        message: {
          subject: 'Booking Confirmed - R.M Bike Point',
          html: `
            <h1>Booking Confirmed</h1>
            <p>Hi ${newData.userName},</p>
            <p>Your service booking for <b>${newData.bikeModel}</b> on <b>${newData.date}</b> at <b>${newData.time}</b> has been confirmed.</p>
            <p>We look forward to seeing you!</p>
          `,
        },
      });
      console.log(`Confirmation email queued for ${newData.userEmail}`);
    }
    return null;
  });

/**
 * Trigger: When a query is replied to
 */
exports.onQueryReplied = functions.firestore
  .document('queries/{queryId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.status === 'replied' && oldData.status !== 'replied') {
      // This is usually handled by the frontend opening mailto/whatsapp, 
      // but we can also log it or send a formal follow-up here.
      console.log(`Query ${context.params.queryId} was replied to.`);
    }
    return null;
  });

/**
 * Trigger: When a new order is placed
 */
exports.onOrderPlaced = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderData = snap.data();

    // Queue email for the customer
    await db.collection('mail').add({
      to: orderData.userEmail,
      message: {
        subject: `Order Confirmed #${context.params.orderId.slice(-6).toUpperCase()}`,
        html: `
          <h1>Order Confirmation</h1>
          <p>Hi ${orderData.userName},</p>
          <p>Your order for spare parts has been placed successfully.</p>
          <h3>Order Details:</h3>
          <ul>
            ${orderData.items.map(item => `<li>${item.name} x ${item.quantity} - ${item.price * item.quantity}</li>`).join('')}
          </ul>
          <p><b>Total Amount: ${orderData.totalAmount}</b></p>
          <p>We will notify you once your order is shipped.</p>
        `,
      },
    });

    // Also notify admin (optional)
    await db.collection('mail').add({
      to: 'chakrabortytamanash@gmail.com',
      message: {
        subject: `New Order Received #${context.params.orderId.slice(-6).toUpperCase()}`,
        html: `<p>New order from ${orderData.userName} (${orderData.userEmail}) for ${orderData.totalAmount}.</p>`,
      },
    });

    return null;
  });
