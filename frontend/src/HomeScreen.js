import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from './AuthContext';
import { getLoans, addLoan, markAsRepaid, getSummary, uploadReceipt } from './api';
import * as ImagePicker from 'expo-image-picker';

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [loansData, summaryData] = await Promise.all([
        getLoans(user.token),
        getSummary(user.token),
      ]);
      setLoans(loansData);
      setSummary(summaryData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
    }
  };

  const handleAddLoan = async () => {
    if (!friendName || !amount || !dueDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      let receiptUrl = null;
      if (receiptPhoto) {
        const formData = new FormData();
        formData.append('receipt', {
          uri: receiptPhoto,
          type: 'image/jpeg',
          name: 'receipt.jpg',
        });
        const uploadResult = await uploadReceipt(user.token, formData);
        receiptUrl = uploadResult.receipt_url;
      }

      await addLoan(user.token, {
        friend_name: friendName,
        amount: parseFloat(amount),
        due_date: dueDate,
        receipt_photo: receiptUrl,
      });

      setModalVisible(false);
      setFriendName('');
      setAmount('');
      setDueDate('');
      setReceiptPhoto(null);
      fetchData();
      Alert.alert('Success', 'Loan added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add loan');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRepaid = async (loanId) => {
    try {
      await markAsRepaid(user.token, loanId);
      fetchData();
      Alert.alert('Success', 'Loan marked as repaid');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark loan as repaid');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setReceiptPhoto(result.assets[0].uri);
    }
  };

  const renderLoanItem = (loan) => (
    <View
      key={loan.id}
      style={[
        styles.loanItem,
        loan.is_overdue && !loan.is_repaid && styles.overdueItem,
      ]}
    >
      <View style={styles.loanHeader}>
        <Text style={styles.friendName}>{loan.friend_name}</Text>
        <Text style={[styles.amount, loan.is_repaid && styles.repaidAmount]}>
          ${loan.amount}
        </Text>
      </View>
      <View style={styles.loanDetails}>
        <Text style={styles.detailText}>Due: {loan.due_date}</Text>
        {loan.is_overdue && !loan.is_repaid && (
          <Text style={styles.overdueText}>OVERDUE</Text>
        )}
        {loan.is_repaid && (
          <Text style={styles.repaidText}>REPAID</Text>
        )}
      </View>
      {!loan.is_repaid && (
        <TouchableOpacity
          style={styles.markRepaidButton}
          onPress={() => handleMarkRepaid(loan.id)}
        >
          <Text style={styles.markRepaidButtonText}>Mark as Repaid</Text>
        </TouchableOpacity>
      )}
      {loan.receipt_photo && (
        <View style={styles.receiptContainer}>
          <Text style={styles.receiptLabel}>Receipt:</Text>
          <Image
            source={{ uri: `http://localhost:3000${loan.receipt_photo}` }}
            style={styles.receiptImage}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MiniLedger</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Lent:</Text>
            <Text style={styles.summaryValue}>${summary.total_lent.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Repaid:</Text>
            <Text style={styles.summaryValue}>${summary.total_repaid.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Overdue:</Text>
            <Text style={[styles.summaryValue, styles.overdueValue]}>
              ${summary.overdue_amount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending:</Text>
            <Text style={styles.summaryValue}>${summary.pending_amount.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.loanList}>
        <Text style={styles.sectionTitle}>Loans</Text>
        {loans.length === 0 ? (
          <Text style={styles.emptyText}>No loans yet. Add one to get started!</Text>
        ) : (
          loans.map(renderLoanItem)
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Loan</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Loan</Text>

            <Text style={styles.label}>Friend Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter friend's name"
              value={friendName}
              onChangeText={setFriendName}
            />

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-12-31"
              value={dueDate}
              onChangeText={setDueDate}
            />

            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonText}>
                {receiptPhoto ? 'Change Receipt Photo' : 'Add Receipt Photo (Optional)'}
              </Text>
            </TouchableOpacity>
            {receiptPhoto && (
              <Image source={{ uri: receiptPhoto }} style={styles.previewImage} />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddLoan}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Adding...' : 'Add Loan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  logoutButton: {
    color: '#4A90E2',
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  overdueValue: {
    color: '#e74c3c',
  },
  loanList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  loanItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  overdueItem: {
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  repaidAmount: {
    color: '#27ae60',
  },
  loanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  overdueText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e74c3c',
    backgroundColor: '#fadbd8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  repaidText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#27ae60',
    backgroundColor: '#d5f5e3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  markRepaidButton: {
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  markRepaidButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  receiptContainer: {
    marginTop: 10,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  receiptImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  photoButton: {
    backgroundColor: '#f39c12',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default HomeScreen;
