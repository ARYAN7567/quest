import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuest } from '../hooks/useQuest';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface Quest {
  id: number;
  title: string;
  description: string;
  price: number;
  is_paid: boolean;
}

interface Question {
  id: number;
  question_text: string;
  options: string[];
  question_order: number;
}

const QuestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quest, questions, loading, error, requiresPayment, refetch } = useQuest(id || '');

  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Payment handling
  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    setPaymentLoading(true);
    try {
      // Create order
      const orderResponse = await api.post('/payments/order', { quest_id: id });
      const { orderId, amount, keyId } = orderResponse.data;

      // Load Razorpay script
      if (!(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      // Open Razorpay modal
      const options = {
        key: keyId,
        amount: amount,
        currency: 'INR',
        name: 'Quest Platform',
        description: quest?.title,
        order_id: orderId,
        handler: async (response: any) => {
          // Verify payment
          await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            quest_id: id,
          });
          toast.success('Payment successful! Access granted.');
          setShowPayment(false);
          refetch();
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#3B82F6',
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        toast.error('Payment failed: ' + response.error.description);
      });
      razorpay.open();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  // Submit answers
  const handleSubmit = async () => {
    if (!user) return;
    if (Object.keys(answers).length !== questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    try {
      const response = await api.post('/submissions', {
        quest_id: id,
        answers,
      });
      setSubmitted(true);
      setSubmissionResult(response.data);
      toast.success(`Quiz submitted! Score: ${response.data.score}%`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Submission failed');
    }
  };

  // Navigation
  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  // Render
  if (loading) return <div className="loading">Loading quest...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!quest) return <div className="error">Quest not found</div>;

  // Show payment required
  if (requiresPayment) {
    return (
      <div className="quest-detail-page payment-required">
        <div className="payment-card">
          <h2>🔒 Payment Required</h2>
          <p>This quest costs <strong>₹{quest.price}</strong>. Please complete payment to access.</p>
          <button
            className="btn btn-primary btn-large"
            onClick={() => setShowPayment(true)}
            disabled={paymentLoading}
          >
            {paymentLoading ? 'Processing...' : `Pay ₹${quest.price}`}
          </button>
        </div>
      </div>
    );
  }

  // Show submitted result
  if (submitted && submissionResult) {
    return (
      <div className="quest-detail-page result-page">
        <div className="result-card">
          <h2>🎉 Quest Completed!</h2>
          <div className="score-circle">
            <span className="score-value">{Math.round(submissionResult.score)}%</span>
          </div>
          <p>You got <strong>{submissionResult.correctAnswersCount}</strong> out of <strong>{submissionResult.totalQuestions}</strong> correct!</p>
          <Link to="/my-quests" className="btn btn-primary">View My Quests</Link>
          <Link to="/quests" className="btn btn-secondary">Try Another Quest</Link>
        </div>
      </div>
    );
  }

  // Show quiz
  const currentQ = questions[currentQuestion];
  const answered = answers[currentQ?.id];

  return (
    <div className="quest-detail-page">
      <div className="quest-header">
        <h1>{quest.title}</h1>
        <div className="quest-info">
          <span className={`badge ${quest.is_paid ? 'paid' : 'free'}`}>
            {quest.is_paid ? `₹${quest.price}` : 'Free'}
          </span>
        </div>
      </div>

      <div className="quiz-container">
        {/* Progress */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className="progress-text">Question {currentQuestion + 1} of {questions.length}</p>

        {/* Question */}
        {currentQ && (
          <div className="question-card">
            <h3>{currentQ.question_text}</h3>
            <div className="options">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${answered === index ? 'selected' : ''}`}
                  onClick={() => handleAnswer(currentQ.id, index)}
                  disabled={submitted}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="quiz-nav">
          <button
            className="btn btn-secondary"
            onClick={goToPrev}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>
          <div className="question-dots">
            {questions.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentQuestion ? 'active' : ''} ${answers[questions[index]?.id] !== undefined ? 'answered' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              />
            ))}
          </div>
          {currentQuestion === questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length}
            >
              Submit Quiz
            </button>
          ) : (
            <button className="btn btn-primary" onClick={goToNext}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestDetail;