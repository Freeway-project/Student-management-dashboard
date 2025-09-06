import { NextRequest, NextResponse } from 'next/server';
import Task from '@/models/Task';
import Submission from '@/models/Submission';
import TaskAssignment from '@/models/TaskAssignment';
import connectDB from '@/lib/mongodb';

export async function POST(
  req: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    await connectDB();
    
    const { id: taskId } = params;
    const body = await req.json();
    const { status, deliverables, message } = body;

    console.log('📝 Task Submit API - Request body:', { status, deliverables, message });

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task status
    if (status) {
      task.status = status;
      await task.save();
    }

    // Create submission record if deliverables are provided
    if (deliverables && deliverables.length > 0) {
      const userId = req.headers.get('x-user-id');
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required in headers' },
          { status: 400 }
        );
      }

      console.log('📝 Creating submission for user:', userId);

      // Check if there's an existing submission
      const existingSubmission = await Submission.findOne({
        taskId,
        submittedBy: userId,
        isLatestVersion: true
      });

      console.log('📝 Existing submission:', existingSubmission ? 'Found' : 'Not found');

      // Transform deliverables to attachments format
      const attachments = deliverables
        .filter((deliverable: any) => deliverable.fileUrl) // Only include deliverables with files
        .map((deliverable: any) => ({
          filename: deliverable.label || deliverable.type || 'Untitled',
          originalName: deliverable.label || deliverable.type || 'Untitled',
          mimeType: deliverable.type === 'PDF' ? 'application/pdf' : 
                   deliverable.type === 'EXCEL' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                   'application/octet-stream',
          size: 0, // We don't have size info from the frontend
          uploadedAt: new Date(),
          driveFileId: deliverable.fileUrl // Store the file URL in driveFileId field
        }));

      console.log('📝 Transformed attachments:', attachments);

      const submissionData = {
        taskId,
        submittedBy: userId,
        submissionType: existingSubmission ? 'REVISION' : 'INITIAL',
        version: existingSubmission ? existingSubmission.version + 1 : 1,
        title: `${task.title} - Submission`,
        description: message || undefined,
        notes: message || undefined,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        attachments // Use attachments instead of deliverables
      };

      // Mark existing submission as not latest
      if (existingSubmission) {
        existingSubmission.isLatestVersion = false;
        await existingSubmission.save();
        console.log('📝 Marked existing submission as not latest');
      }

      // Save new submission
      console.log('📝 Creating new submission with data:', submissionData);
      const newSubmission = new Submission(submissionData);
      await newSubmission.save();
      console.log('📝 New submission created with ID:', newSubmission._id);

      // Update task assignment status
      const taskAssignmentUpdate = await TaskAssignment.updateOne(
        { taskId, assigneeUserId: userId },
        { 
          status: 'IN_REVIEW', // Use the correct enum value for submitted assignments
          lastSubmissionId: newSubmission._id,
          lastSubmittedAt: new Date(),
          $inc: { attempts: 1 }
        }
      );
      console.log('📝 TaskAssignment update result:', taskAssignmentUpdate);
    }

    console.log('📝 Task submission completed successfully');
    return NextResponse.json({ 
      message: 'Submission successful',
      submissionCreated: deliverables && deliverables.length > 0
    });

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit task' },
      { status: 500 }
    );
  }
}