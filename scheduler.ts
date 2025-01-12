import Agenda from "agenda";
import { Post, Schedule } from "./models";
import textPublish from "./components/linkedinPublish/textPublish";
import imagePublish from "./components/linkedinPublish/imagePublish";
import documentPublish from "./components/linkedinPublish/documentPublish";

const agenda = new Agenda({
  db: { address: process.env.MONGO_URI as string },
  processEvery: "1 minute", // Check for jobs every 5 minutes
});

const updateSchedule = async ({
  scheduledId,
  data,
  error,
}: {
  scheduledId: string;
  data: any;
  error: any;
}) => {
  try {
    if (error) {
      await Schedule.findByIdAndUpdate(scheduledId, {
        status: "failed",
      });

      throw new Error(error);
    } else {
      await Schedule.findByIdAndUpdate(scheduledId, {
        status: "published",
        publishedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error processing scheduled posts:", error);
  }
};

// Define the scheduled task
agenda.define("publish posts", async (job: any) => {
  console.log("Executing 'publish posts' job...");

  const now = new Date();

  try {
    const scheduledPosts = (await Schedule.find({
      status: "scheduled",
      scheduledAt: { $lte: now },
    })) as any;

    for (const scheduledTask of scheduledPosts) {
      try {
        console.log(
          `Publishing post to ${scheduledTask.platform}:`,
          scheduledTask
        );

        const post = (await Post.findById(scheduledTask.postId)) as any;

        if (post.type === "text") {
          const { data, error } = await textPublish(scheduledTask.postId);
          await updateSchedule({
            scheduledId: scheduledTask._id,
            data,
            error,
          });
        } else if (post.type === "image") {
          const { data, error } = await imagePublish(scheduledTask.postId);
          await updateSchedule({
            scheduledId: scheduledTask._id,
            data,
            error,
          });
        } else if (post.type === "carousel") {
          const { data, error } = await documentPublish(scheduledTask.postId);

          await updateSchedule({
            scheduledId: scheduledTask._id,
            data,
            error,
          });
        }

        // Simulate publishing logic
        // post.status = "published";
        // post.publishedAt = new Date();
        // await post.save();

        console.log(`Post ${scheduledTask._id} published successfully.`);
      } catch (error) {
        console.error(`Failed to publish post ${scheduledTask._id}:`, error);

        // Mark the post as failed
        scheduledTask.status = "failed";
        await scheduledTask.save();
      }
    }
  } catch (error) {
    console.error("Error processing scheduled posts:", error);
  }
});

// Start Agenda
const startScheduler = async () => {
  await agenda.start();
  console.log("Agenda scheduler started.");

  // Schedule recurring jobs
  await agenda.every("1 minute", "publish posts");
};

export default startScheduler;
